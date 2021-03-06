angular.module('starter.controllers', ['angularMoment', 'chart.js'])

//.controller('TimerCtrl', function($scope) {})
.controller('TimerCtrl', ['$scope', 'moment', '$interval', '$state', 'ShareData','Routines', 'TimerCalcs', 'LocalStorage', function($scope, moment, $interval, $state, ShareData, Routines, TimerCalcs, LocalStorage) {

//Include functions here that involve $scope variables

 var evaluateButtonStatus = function(){

    console.log("Hello from evaluateButtonStatus");

    if (TimerCalcs.is_attemptRunning(oneRoutine) === false){
      $scope.buttonStatus = "none";
    } else if(TimerCalcs.is_attemptRunning(oneRoutine) === true && oneRoutine.currentOps.activeStep != null){
      $scope.buttonStatus = "probably";
    } else if(TimerCalcs.is_attemptRunning(oneRoutine) === true && oneRoutine.currentOps.activeStep == null){
      $scope.buttonStatus = "definitely";
    };
  };

 ///////// updateTime functions
  var pulsar;

  var startUpdateTime = function(clickedStep){
   pulsar = $interval(function(){
    updateTime(clickedStep);
   // console.log("UPDATE Clicked Step:: ", clickedStep);
   }, 1000, [clickedStep]);
   // we pass [clickedStep] in as a parameter to the callbackfunction
  }

  function updateTime(runningStep){
    var diff = currentDiff();
    TimerCalcs.changeDiff(runningStep, diff, oneRoutine);

    var currentAttempt = oneRoutine.attempts[oneRoutine.currentOps.workingAttempt-1];
    $scope.bigDiff = TimerCalcs.calcDurationAttempt(currentAttempt);

    console.log("ONE ROUTINE TO RULE THEM ALL (oneRoutine from updateTime) : " , oneRoutine);
    console.log("Tick tock ($scope.steps from updateTime",$scope.steps);
  }

  var currentDiff = function(){
    var currentStep = oneRoutine.currentOps.activeStep;

    var timeArray = TimerCalcs.getTimeArray(currentStep, oneRoutine); //.timeArray;
    var total = TimerCalcs.calcMultipleSegments(timeArray);
    return total;
  }

  var stopPulsar = function(){
    $interval.cancel(pulsar);
  }
  ///////end update time stuff

  //INITIALIZE DATA FOR TIMER PAGE

  //Use timer to reference scope of this controller.
  $scope.timer = $scope;


  //MAYBE LATER If no routine is "active" send user to Routines page to pick one

  //Initialize data -- load from "ShareData" service!
  //LOAD LATEST DATA -- Just to be safe
  var allData = LocalStorage.loadFromLocalStorage();

  // To "activate" and share a given routine...  Share activeRoutine by using ShareData.oneRoutine variable.  Because Objects are a reference type, this works
  ShareData.oneRoutine = allData.routines[allData.appOps.activeRoutine];

  var oneRoutine = ShareData.oneRoutine; //because Objects are reference type, this works!

  console.log("This is loaded data in TimerCtrl - ShareData.oneRoutine ",oneRoutine);

  //Load data about the routine into $scope for displaying
  $scope.routineTitle = oneRoutine.title; //store the title

  $scope.steps = oneRoutine.steps; //store the steps array


  //DETERMINE WHAT IS CURRENT STATE OF CURRENT ROUTINE AND DISPLAY APPROPRIATE STUFF

  //UPDATE TIMER MAIN BUTTON
  evaluateButtonStatus();

  //START PULSAR IF APPROPRIATE
  if ($scope.buttonStatus === "probably") { //This means a step is running for this routine
    console.log("We think a step is running and want to start the pulsar");

   startUpdateTime(oneRoutine.currentOps.activeStep); //PASS IN OBJECT FORM OF ACTIVESTEP
  };

  //Get data for bigDiff, if pulsar not going to run
  if ($scope.buttonStatus === "definitely") {
    var currentAttempt = oneRoutine.attempts[oneRoutine.currentOps.workingAttempt-1];
    $scope.bigDiff = TimerCalcs.calcDurationAttempt(currentAttempt);
  };

  $scope.addStep = function(newStep){

    //First validate that there is not already a step with this same name
    var found = TimerCalcs.findElementByTitle(newStep,$scope.steps);

    //Only create new step if this step did not previously exist (return value -1)

    //PRESENTLY NO UI FOR ERROR MESSAGES -- ADD THIS LATER ***

    // also filters out empty steps
    if (found === -1 && newStep != "") {
      var tempObj = {
        "title" : newStep
        ,"timeDiff" : null
        ,"status" : "todo"
      }
      $scope.steps.push(tempObj);

      //Save data to LocalStorage
      LocalStorage.saveToLocalStorage();

     // LocalStorage.saveToLocalStorage(LocalStorage.mergeRoutineIntoDataTree());
      // ShareData.saveToLocalStorage(oneRoutine);
    }

    // ShareData.wow = ShareData.wow+" "+newStep; //FOR TESTING
    // console.log(ShareData.wow);

    //Erase the user's value, regardless of whether it was created or not
    $scope.newStep = "";

  };

  $scope.startStep = function(clickedStep){
    //Ionic passes us clickedStep based on which list item user clicked on
    // This is the currently active step, Null if none is active

    console.log("DARTH Hello from start step");
    console.log("DARTH This is what was clicked",clickedStep);
    console.log("DARTH this is typeof what was clicked ", typeof clickedStep);

    var clickedStepString = clickedStep.title;

   // clickedStep = clickedStepString;

    var activeStep = oneRoutine.currentOps.activeStep;

    if (activeStep === clickedStep) { //If user clicks on current step, then nothing should happen. Let it keep timing.
      // console.log("you're already on this step.");
      return;
    }

    //This means there is no attempt running and we need to create one
    if (TimerCalcs.is_attemptRunning(oneRoutine) === false) {

      //Initiate a new attempt by creating an array to hold the steps of that attempt
     // console.log("Hello from new attempt init");
      oneRoutine.attempts.push([]);
      //consider saving oneRoutine to LocalStorage here later
    }
    //This means some other step is running and we need to stop it
    if (activeStep != null) {
      TimerCalcs.stopStep(activeStep, oneRoutine);
      stopPulsar();
    }

    //Get here if we really, truly want to start the clickedStep timer
    //Set activeStep to be clickedStep
    oneRoutine.currentOps.activeStep = clickedStep;
    activeStep = oneRoutine.currentOps.activeStep;

    //Set status of this step to be "doing"
    TimerCalcs.changeStatus(clickedStep, "doing", oneRoutine);

    //Back-end timer start (i.e., push step name and start time into tree, as appropriate)
    TimerCalcs.setStartTime(clickedStep, oneRoutine);

    //Front-end timer start (i.e., change CSS and start pulsing clock)
    //start(clickedStep); //this starts the timer
    startUpdateTime(clickedStep);

    //UPDATE TIMER MAIN BUTTON
    evaluateButtonStatus();

    //Save data to LocalStorage
    LocalStorage.saveToLocalStorage();

  } //END OF STARTSTEP

  $scope.probablyDone = function(){
    var activeStep = oneRoutine.currentOps.activeStep;
    if (activeStep != null) {
      TimerCalcs.stopStep(activeStep, oneRoutine);
      stopPulsar();

      //set ACTIVESTEP = null to show that no steps are now running
      oneRoutine.currentOps.activeStep = null;

      //UPDATE TIMER MAIN BUTTON
      evaluateButtonStatus();
    }

    //Save data to LocalStorage
    LocalStorage.saveToLocalStorage();

    //LocalStorage.saveToLocalStorage(LocalStorage.mergeRoutineIntoDataTree());

    //OLD WAY ShareData.saveToLocalStorage(oneRoutine);
  }

   $scope.finishAttempt = function(){

    //Increment currentAttempt
    oneRoutine.currentOps.workingAttempt += 1;
    //we think this "locks" the prior attempt so that user cannot modify it / access it anymore

    //Reset oneRoutine.steps so that all are "todo" and timeDiff is null
    for (var i = 0; i < $scope.steps.length; i++) { // MIGHT BE WHERE TIMEDIFF ISSUE IS
      $scope.steps[i].timeDiff = null;
      $scope.steps[i].status = "todo";
    };

    //Reset the button status to "none"
    $scope.buttonStatus = "none";

    //Save data to LocalStorage
    LocalStorage.saveToLocalStorage();

    //LocalStorage.saveToLocalStorage(LocalStorage.mergeRoutineIntoDataTree());

    //OLD WAY ShareData.saveToLocalStorage(oneRoutine);

    //Redirect to graphs view, once it is ready
    $state.go('tab.graph');
   }

}]) // END OF TIMERCTRL CONTROLLER

.controller('GraphCtrl', ['$scope', 'ShareData', 'TimerCalcs', 'GraphCalcs', 'LocalStorage', function($scope, ShareData, TimerCalcs, GraphCalcs, LocalStorage) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  //Initialize data
  var oneRoutine = ShareData.oneRoutine; //because Objects are reference type, this works!

  //Start with the all attempts view
  $scope.chartSelector = "allChrono"; //other options are "allFastest" or "oneDetail"
  $scope.routineTitle = oneRoutine.title;

  //All attempts chart
  var chartAllAttempts = function() {
    //Labels on X axis
    $scope.labels = GraphCalcs.getAttemptNames(oneRoutine);

    //Data for Y axis -- how long each attempt took
    var attemptDurations = GraphCalcs.getAttemptDurations(oneRoutine);
    $scope.data = [attemptDurations]; //Need to put result in an array to match angular-chart's expectations

    console.log("This is going into multi-attempt graph, first labels then data ",$scope.labels,$scope.data);

    //This is for if we convert this to a more generic chart engine
    // $scope.chartId = "bar";
    // $scope.chartClass = "chart chart-bar";
    // $scope.chartClick = "onClick";
  };

  var chartOneAttempt = function(attempt, attemptIndex) { //REFACTOR AS BOTH PARAMS NOT NEEDED?
    //Labels on X axis
    $scope.labelsDetail = GraphCalcs.getStepNames(attemptIndex, oneRoutine);
    $scope.dataDetail = GraphCalcs.getStepDurations(attemptIndex, oneRoutine);

    console.log("This is going into attempt detail donut, first labels then data ",$scope.labelsDetail,$scope.dataDetail);
  };

  //THIS IS MAIN OPERATION FOR THE GRAPH / ANALYSIS PAGE
  //So long as there is some data for this routine, show the graphs; otherwise give message

  if (oneRoutine.attempts.length > 0) {

    //Show the graph of all attempts
    chartAllAttempts();

    //Automatically show donut for the most recent attempt
    $scope.thisAttemptTime = "Your Most Recent Routine"
    chartOneAttempt(null,oneRoutine.attempts.length-1); //FIRST PARAM IS NOT NEEDED!

  };

  $scope.clickAttempt = function(points, evt) {
    console.log("Which attempt was clicked?");

    prettyTimeClicked = points[0]._saved.label; // This is the "pretty" formatted time of the attempt that user clicked, but since it is "pretty" and not exact, we can only compare it to other pretty times in the attempts array
    //adds a label to the donut
    $scope.thisAttemptTime = "Your routine at: " + prettyTimeClicked;

    //Look up "prettyTimeClicked" in the array of prettyTimes
    var foundResult = GraphCalcs.convertPrettyTimeToFullAttempt(prettyTimeClicked, oneRoutine);

    var attemptDetail = foundResult.array;
    var attemptDetailIndex = foundResult.index;

    if (attemptDetailIndex != -1) {
      //Show the detail chart of this Attempt
      chartOneAttempt(attemptDetail, attemptDetailIndex);
    } else {
      console.log("Fire in the hole! There's an error in $scope.clickAttempt in GraphsCtrl")
    }
  };

}])

.controller('RoutinesCtrl', ['$scope','ShareData', 'Routines', 'LocalStorage', 'RoutineCalcs', "$state", function($scope, ShareData, Routines, LocalStorage, RoutineCalcs, $state) {

  //INITIALIZE DATA FOR APP, which defaults to Routines page.  Thus, this should be the first code that runs in the app after being launched

  console.log("This should be first code to run... Start of RoutinesCtrl");

  //Check if localStorage exists with Nawdler data.  If so, load it.  If not, create it with default template
  var allData = LocalStorage.loadFromLocalStorage();

  //allData will be false if there is nothing with "Nawdler" key in localStorage. See loadFromLocalStorage function
  if (!allData) {
    //Get here if there is no "nawdler" data in localStorage
    console.log("Nothing for Nawdler in localStorage");

    //load data template from factory new user with example routines
    var allData = Routines.template(); //get the template data from the factory
    console.log("Starting Nawdler with template data in RoutineCtrl", allData);

    //Save full template data to localStorage
    window.localStorage.setItem("Nawdler", JSON.stringify(allData));

    //LocalStorage.initialSaveToLocalStorage(allData);
  } else {
    console.log("Found stuff in LocalStorage to start Nawdler with");
  };

  //Set oneRoutine to be active routine
  //Determine which routine is the "active" one for the user
  var activeRoutine = allData.appOps.activeRoutine; //get the index number of the active routine

  // To "activate" and share a given routine...  Share activeRoutine by using ShareData.oneRoutine variable.  Because Objects are a reference type, this works
  ShareData.oneRoutine = allData.routines[activeRoutine];

  console.log("This is ShareData.oneRoutine in RoutinesCtrl ", ShareData.oneRoutine);

  //PREP FOR ROUTINES PAGE USER INTERACTIONS
  //Use 'routines' term to reference scope of this controller -- important for HTML template
  $scope.routines = $scope;

  //grabbing all the routine names from the data
  var routineArray = RoutineCalcs.getRoutineDisplayObjects(allData);
  
  console.log("STEVEN - This is what is going to be displayed ",routineArray);

  //Make the "routines" array for template ng-repeat, or use an empty array
  $scope.routineArray = routineArray || [];

  //Start with delete buttons hidden
  $scope.shouldShowEditView = false;

  $scope.addRoutine = function(newRoutine){
    //validates that the new routine isn't blank
    // We may want to have it auto name if it's blank. "Routine 1" or something.

    if(newRoutine != ""){
      //Create 'virgin' routine object
      var routineObj = {"title": newRoutine
                    ,"steps": []
                    ,"currentOps": {"activeStep" : null //which step is currently active, //"Null" if no step is running, i.e., Pause mode
                                   ,"workingAttempt" : 1 //# (not index 0) of the current attempt; increment it when you hit "Finished" //start at 1
                                    }
                    ,"attempts":[]
                    };
      //grabs the data from localStorage
      var fullTree = LocalStorage.loadFromLocalStorage();
      //Pushes in our new "virgin" routine object
      fullTree.routines.push(routineObj);

      //saves the whole tree back into localStorage
      window.localStorage.setItem("Nawdler", JSON.stringify(fullTree));
      //$scope.routineArray.push();//THING***
      fullTree = LocalStorage.loadFromLocalStorage();
      var routineArray = RoutineCalcs.getRoutineDisplayObjects(fullTree);
      //Make the "routines" array for template ng-repeat, or use an empty array
      $scope.routineArray = routineArray;
      console.log("Trying to add to arrray ", routineArray);
    }

    //Erase the user's value, regardless of whether it was created or not
    $scope.newRoutine = "";
  };

  $scope.selectRoutine = function(clickedRoutine){
    //Get here when user clicks on routine to activate it

    var allData = LocalStorage.loadFromLocalStorage();

    // needs to: make this routine the active one
    // unmake any previous active routine
    // take us over to the timer page with that routine loaded

    console.log("NICE Clicked on a routine, and all I got was this ",clickedRoutine);
    console.log("This is the active index before adjusting ",allData.appOps.activeRoutine);

    //This is the routine that was clicked
    var clickedRoutineString = clickedRoutine.title;

    //Set flag of formerly active routine to be inactive
    $scope.routineArray[allData.appOps.activeRoutine].activeStatus = "inactive";

    //set activeRoutine to this routine's index
    allData.appOps.activeRoutine = clickedRoutine.index;

    console.log("This is the active index after adjusting ",allData.appOps.activeRoutine);

    // To "activate" and share a given routine...  Share activeRoutine by using ShareData.oneRoutine variable.  Because Objects are a reference type, this works
    ShareData.oneRoutine = allData.routines[allData.appOps.activeRoutine];

    console.log("This is the newly selected routine ",ShareData.oneRoutine);

    //Adjust flags in array that holds routines for ng-repeat
    //$scope.routineArray = RoutineCalcs.getRoutineDisplayObjects(allData);
    $scope.routineArray[clickedRoutine.index].activeStatus = "active";

    console.log("STEVEN This is what is getting ng-repeated in Routines page ",$scope.routineArray);

    //Save data to LocalStorage
    LocalStorage.saveAppOpsToLocalStorage(clickedRoutine.index);
    //redirect to the timer page.
    $state.go('tab.timer');

  }

  $scope.reorderRoutine = function(movedRoutine, fromIndex, toIndex) {
    
    //MOVE THE ROUTINE IN THE FRONT-END ARRAY
    //Remove the item from the old location in the array
    $scope.routineArray.splice(fromIndex, 1);
    //Add the item to the new location in the array
    $scope.routineArray.splice(toIndex, 0, movedRoutine);

    //MOVE THE ROUTINE IN THE BACK-END DATA TREE
    //RELOAD FROM LOCALSTORAGE, JUST IN CASE
    var allData = LocalStorage.loadFromLocalStorage();

    var movedRoutine = allData.routines[fromIndex];
    //Remove the item from the old location in the array
    allData.routines.splice(fromIndex, 1);
    //Add the item to the new location in the array
    allData.routines.splice(toIndex, 0, movedRoutine);

    //NEED TO ADJUST ACTIVEROUTINE INDEX IN APPOPS
    //If user moves activeRoutine, set it to the toIndex
    //If user moves something from before to after, move activeRoutine to lower index
    //If user moves something from after to before, move activeRoutine to higher index
    var activeIndex = allData.appOps.activeRoutine
    if (activeIndex === fromIndex) {
      allData.appOps.activeRoutine = toIndex;
    } else if (fromIndex < activeIndex && toIndex >= activeIndex) {
      allData.appOps.activeRoutine -= 1;
    } else if (toIndex <= activeIndex && fromIndex > activeIndex) {
      allData.appOps.activeRoutine += 1;
    };

    //RESAVE THE ENTIRE TREE TO LOCAL STORAGE
    window.localStorage.setItem("Nawdler", JSON.stringify(allData));

    //Regenerate the display array with fresh data
    $scope.routineArray = RoutineCalcs.getRoutineDisplayObjects(allData);
  };
  
  // Maybe with swipe?
  $scope.deleteRoutine = function(routine, index){
    //DELETE FROM FRONT-END ARRAY
    $scope.routineArray.splice(index, 1)

    //DELETE FROM BACK-END DATA TREE
    //RELOAD FROM LOCALSTORAGE, JUST IN CASE
    var allData = LocalStorage.loadFromLocalStorage();

    //Remove from the data tree
    allData.routines.splice(index, 1);

    //DEAL WITH ACTIVEROUTINE INDEX IN APPOPS -- shift to 0 if user deletes activeRoutine, and decrement if activeRoutine is higher than deleted Routine
    if (allData.appOps.activeRoutine === index) {
      allData.appOps.activeRoutine = 0; //Reset to top of array, if activeRoutine is the one that was deleted
    } else if (allData.appOps.activeRoutine >= index) {
      allData.appOps.activeRoutine -= 1;
    }

    //RESAVE THE ENTIRE TREE TO LOCAL STORAGE
    window.localStorage.setItem("Nawdler", JSON.stringify(allData));

    //Regenerate the display array with fresh data
    $scope.routineArray = RoutineCalcs.getRoutineDisplayObjects(allData);

  }

}]);
