#include <iostream>
#include "RTIMULib.h"
#include "/usr/local/include/oscpack/osc/OscOutboundPacketStream.h"
#include "/usr/local/include/oscpack/ip/UdpSocket.h"

//#define ADDRESS "192.168.188.66"
#define ADDRESS "192.168.188.62"
#define PORT 9000
#define OUTPUT_BUFFER_SIZE 1024

RTQuaternion quat;
RTQuaternion quat_s;

float slerp = 0.5;

//axis alignment

bool store = false;
int counter = 0;

int main(int argc, char* argv[]) {

    (void) argc; // suppress unused parameter warnings
    (void) argv; // suppress unused parameter warnings

    int sampleCount = 0;
    int sampleRate = 0;

    uint64_t rateTimer;
    uint64_t displayTimer;
    uint64_t now;

/*    initscr();
    cbreak();
    noecho();
    scrollok(stdscr, TRUE);
    nodelay(stdscr, TRUE);*/

    RTIMUSettings *settings = new RTIMUSettings("RTIMULib");
    RTIMU *imu = RTIMU::createIMU(settings);
    if ((imu == NULL) || (imu->IMUType() == RTIMU_TYPE_NULL)) {
        std::cout<<"No IMU found\n";
        exit(1);
    }

    imu->IMUInit();

    imu->setSlerpPower(slerp);
    imu->setGyroEnable(true);
    imu->setAccelEnable(true);
    imu->setCompassEnable(true);

    rateTimer = RTMath::currentUSecsSinceEpoch();

    UdpTransmitSocket transmitSocket( IpEndpointName( ADDRESS, PORT ) );

    char buffer[OUTPUT_BUFFER_SIZE];

    while (1) {

        usleep(imu->IMUGetPollInterval() * 1000);

        while (imu->IMURead()) {
            RTIMU_DATA imuData = imu->getIMUData();
            sampleCount++;

	    if(imuData.fusionQPoseValid){
		quat = imuData.fusionQPose;
	    }

	    if(counter < 50){
		counter++;
	    }
	    else if (counter == 50){
		counter=51;
		store = true;
	    }
	    /*if (getch() == 'a') {
		store=true;
	    }*/

	   if (store){
		quat_s = quat;
		quat_s = quat_s.conjugate();
		store = false;
		std::cout<<"centered\n";
	   }

	   quat *= quat_s;

	   quat.normalize();

	   if ((now - rateTimer) > 1000000) {
		sampleRate = sampleCount;
		sampleCount = 0;
		rateTimer = now;
	   }
	}

/*	RTVector3 vec;

	quat.toEuler(vec);

	std::cout<<RTMath::displayDegrees("", vec);
	std::cout<<"\n";

	std::cout<<"w: ";
	std::cout<<quat.scalar();
	std::cout<<" , x: ";
	std::cout<<quat.x();
	std::cout<<" , y: ";
	std::cout<<quat.y();
	std::cout<<" , z: ";
	std::cout<<quat.z();
	std::cout<<"\n";*/

	osc::OutboundPacketStream p( buffer, OUTPUT_BUFFER_SIZE );
    	p << osc::BeginBundleImmediate

        	<< osc::BeginMessage( "/w" )
		<< (float)quat.scalar()
		<< osc::EndMessage

        	<< osc::BeginMessage( "/x" )
		<< (float)quat.x()
		<< osc::EndMessage

        	<< osc::BeginMessage( "/y" )
		<< (float)quat.y()
		<< osc::EndMessage

        	<< osc::BeginMessage( "/z" )
		<< (float)quat.z()
		<< osc::EndMessage

        	<< osc::EndBundle;
	transmitSocket.Send( p.Data(), p.Size() );
    }
}

