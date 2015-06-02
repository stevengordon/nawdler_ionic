angular.module('starter.controllers', ['angularMoment'])

//.controller('TimerCtrl', function($scope) {})
.controller('TimerCtrl', ['$scope', 'moment', '$interval', '$state', 'Routines', 'TimerCalcs', function($scope, moment, $interval, $state, Routines, TimerCalcs) {

  //Use timer to reference scope of this controller.
  $scope.timer = $scope;
  //GETTERS AND SETTERS
  var allData = Routines.template(); //get the sample data from the factory
  var oneRoutine = allData["Routine1"]; //focus on the first (now only) routine, at least for now
  $scope.routineTitle = oneRoutine.title; //store the title


  //WE MAY NEED TO MOVE THIS TO OUR PULSING ITERATOR
  $scope.steps = oneRoutine.steps; //store the steps array


// var test = [{"started_at": moment.utc("2015-06-01T10:15:00","DD/MM/YYYY HH:mm:ss")
//            ,"ended_at" : moment.utc("2015-06-01T10:27:00","DD/MM/YYYY HH:mm:ss")
//              }
//            ,{"started_at": moment.utc("2015-06-02T10:00:00","DD/MM/YYYY HH:mm:ss")
//            , "ended_at" : null
//            }];

//DURATION CALCULATIONS


    // var start = moment.utc("2015-06-01T10:15:00","DD/MM/YYYY HH:mm:ss");
    // var finish = moment.utc("2015-06-01T11:45:10","DD/MM/YYYY HH:mm:ss");
    // //var finish = moment();
    // //var dur = finish.diff(start,"DD/MM/YYYY HH:mm:ss");
    // var x = TimerCalcs.calcDurationSegment(start,finish);
    // console.log(x);
    // $scope.currentTime = x;

  //moment.utc(dur).format('HH:mm:ss');

  $scope.addStep = function(newStep){
    console.log("CLICKED!")
    console.log("CLIIIIIICKED", $scope.newStep)
    console.log("Hello from addStep method in controller");

    //console.log("This is $scope in addStep",$scope);

    var tempObj = {"title" : newStep
      ,"timeDiff" : null
      ,"status" : "todo"
    }
    $scope.steps.push(tempObj);
    console.log("Scope.steps AddSteps after adding new step::  ", $scope.steps);
    console.log("oneRoutine.steps:: ", oneRoutine.steps);
    $scope.newStep = "";
  };

  $scope.startStep = function(clickedStep){
    //Ionic passes us clickedStep based on which list item user clicked on!
    // This is the currently active step, Null if none is active
    var activeStep = oneRoutine.currentOps.activeStep;

    if (activeStep === clickedStep) { //If user clicks on current step, then nothing should happen. Let it keep timing.
      console.log("you're already on this step.");
      return;
    }
    
    //This means there is no attempt running and we need to create one
    if (TimerCalcs.is_attemptRunning(oneRoutine) === false) { 

      //Initiate a new attempt by creating an array to hold the steps of that attempt
     console.log("Hello from new attempt init");
      oneRoutine.attempts.push([]);
      //consider saving oneRoutine to LocalStorage here later
    }

    //This means some other step is running and we need to stop it
    if (activeStep != null) { 
      TimerCalcs.stopStep(activeStep, oneRoutine);
    }

    //Get here if we really, truly want to start the clickedStep timer
    //Set activeStep to be clickedStep
    oneRoutine.currentOps.activeStep = clickedStep;

    console.log("Hello from right before change status");
    //Set status of this step to be "doing"
    TimerCalcs.changeStatus(clickedStep, "doing", oneRoutine); 

    //Back-end timer start (i.e., push step name and start time into tree, as appropriate)
    TimerCalcs.setStartTime(clickedStep, oneRoutine);

    //Front-end timer start (i.e., change CSS and start pulsing clock)
    //start(clickedStep); //this starts the timer




    console.log("OneRoutine -- Yoda");
    console.log(oneRoutine);

    console.log("attempts");
    console.log(oneRoutine.attempts);

    console.log("activeStep");
    console.log(activeStep);
  } //END OF STARTSTEP

  ///////// updateTime stuff
  var pulsar;
  var start = function(clickedStep){
   pulsar = $interval(function(clickedStep){
    var now = moment();
    titleTime.clickedStep = now;
    //console.log(now);
   }, 1000);
  }

  // function updateTime(clickedStep){
  //   // var now = moment();
  //   // titleTime.breakfast = now;
  //   // console.log(now);
  //   //console.log("update time");
  //   //updateCurrentTime();
  // }

  // $scope.stop = function(){
  //   $interval.cancel(pulsar);
  // }
  ///////end update time stuff


  // $scope.active = TimerCalcs.is_attemptRunning(oneRoutine);
  // console.log($scope.active);

}])

.controller('ReportCtrl', function($scope) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  }
})


.controller('RoutinesCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
