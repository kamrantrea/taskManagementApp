// Kamran Trea
//To do List App
//Final Project

(function() {

		var selectedTask = null; // this is set when you click in a task

		function checkLocalStorage(){
			// Checks if localstorage works on the browser
			return typeof localStorage !== 'undefined'
		}

		function saveToDB(task){
			// Creates a string from JSON we can store in localstorage to parse later
			var taskDB = getDB(); // get the DB 
			taskDB[task.id] = task; // use the ID as key and the task as value for the db
			
			var updatedDB = JSON.stringify(taskDB); // create JSON string we can save to Local Storage
			localStorage.setItem('taskDB',updatedDB);// update local storage
		}

		function getDB(){
			var db = localStorage.getItem('taskDB') // gets the DB from local storage
			return JSON.parse(db) || {}; // and parses to json so we can use it as an object
		}

		function getTaskFromDB(id){
			var DB = getDB() // get DB from LocalStorage
			var task = DB[id]; // get the task by ID


			// check what type of task it is and return a new instance of the class
			if(task.kind==='Appt'){
				return Appt.fromObj(task)
			}
			
			if(task.kind==='Task'){
				return Task.fromObj(task)
			}

			if(task.kind==='Shopping'){
				return Shopping.fromObj(task)
			}

		}
		
		function deleteFromDB(id){
			// To delete from the DB, we look up based on the ID and then delete it from the DB object, after that we update the local storage without the deleted task
			
			var taskDB = getDB(); // Get DB from LocalStorage
			delete taskDB[id]; // Delete from Obj

			var updatedDB = JSON.stringify(taskDB) // Create JSON string to store
			localStorage.setItem('taskDB',updatedDB); // save to local storage
		}
		
		// CLASSES

		// BASE TASK CLASS
		class Task {

			constructor(id,desc,priority,complete,entryDate){
				this.id = id;
				this.desc = desc;
				this.priority = priority;
				this.complete = complete;
				this.entryDate = entryDate;
				this.kind = 'Task'
			}

			create(){
				// To create a task we just need to call the save method
				this.save();
			}

			static read(id){
				return getTaskFromDB(id)
			}

			markComplete(complete){
				this.complete = complete || false;
				this.save();
			}

			update(data){
				
				// To update a task, we verify we are getting new data and then update it in our instance
				// then we call the save method to update it on the DB


				// check for properties update
				if(data['desc']){
					this.desc = data["desc" ]
				}
				
				if(data['priority']){
					this.priority = data["priority" ]
				}

				if(data['complete']){
					this.complete = data["complete" ]
				}

				// call the save method
				this.save()
			}

			delete(){
				var id = this.id;
				deleteFromDB(id);
			}

			save(){
				// to save our task to the DB we must save it as an object
				var task = this.toObj()				
				saveToDB(task);
			}
			
			toObj(){
				// returns the object representation of our task
				// so we can store it as json in the DB
				return {
					id:this.id,
					kind:this.kind,
					desc:this.desc,
					priority:this.priority,
					complete:this.complete,
					entryDate:this.entryDate
				}
			}

			static fromObj(obj){
				// return a new instance of this class from an object
				return new Task(obj['id'],obj['desc'],obj['priority'],obj['complete'],obj['entryDate'])
			}

		}

		class Appt extends Task{
			
			constructor(id,desc,priority,complete,entryDate,dateDue,timeDue,place){
				super(id,desc,priority,complete,entryDate);
			
				this.dateDue = dateDue;
				this.timeDue = timeDue;
				this.place = place;
				this.kind = "Appt"
			}

			update(data){
				// Use the parent update method and then update locally
				super.update(data);

				if(data['dateDue']){
					this.dateDue = data['dateDue'];
				}

				if(data['timeDue']){
					this.timeDue = data['timeDue'];
				}

				if(data['place']){
					this.place = data['place'];
				}

				// call the save method to update the DB
				this.save();

			}

			toObj(){
				// use the toObj of the parent and then merge it with the method of this class and return a new object with all properties merged
				var baseData = super.toObj() 

				// Object assin is for merging objects
				return Object.assign(baseData,{
					dateDue:this.dateDue,
					timeDue:this.timeDue,
					place:this.place
				})
			}
			static fromObj(obj){
				// return a new instance of this class from an object
				return new Appt(obj['id'],obj['desc'],obj['priority'],obj['complete'],obj['entryDate'],obj['dateDue'],obj['timeDue'],obj['place']);
			}
		}

		class Shopping extends Task{
			constructor(id,desc,priority,complete,entryDate,items,notes){
				super(id,desc,priority,complete,entryDate);
				this.items = items;
				this.notes = notes;
				this.kind = "Shopping";
			}

			update(data){
				// Use the parent update method and then update locally
				super.update(data);
				this.items = items;
				this.notes = notes;
			}

			toObj(){
				// use the toObj of the parent and then merge it with the method of this class and return a new object with all properties merged
				var baseData = super.toObj() 

				// Object assin is for merging objects

				return Object.assign(baseData,{
					items:this.items,
					notes:this.notes
				})
			}
			static fromObj(obj){
				// return a new instance of this class from an object
				return new Shopping(obj['id'],obj['desc'],obj['priority'],obj['complete'],obj['entryDate'],obj['items'],obj['notes'])
			}
		}

		// UI HANDLERS
    function selectTaskType(){
    	//
    	var taskType = document.getElementById('taskTypeDropDown').value;
    	if(taskType==='Appt'){
	      document.getElementById('apptOpts').style="display:block";
	      document.getElementById('shoppingOpts').style="display:none";
    	}
    	else if(taskType==="Shopping"){
	      document.getElementById('apptOpts').style="display:none";
	      document.getElementById('shoppingOpts').style="display:block";
    	}
    	else{
	      document.getElementById('shoppingOpts').style="display:none";
	      document.getElementById('apptOpts').style="display:none";
    	}
    }

    function refreshTasks(){
    	// Colors for the priority
    	var priorityColors = {1:"red",2:"orange",3:"green"};
    	var sortCriteria = document.getElementById('sortDropDown').value;
    	// gets all the tasks from the DB and shows them
    	var DB = getDB();

    	if(Object.entries(DB).length===0) {
    		document.getElementById('taskList').innerHTML = "Empty (No Tasks)";
    		return false;
    	}

    	// String to update html
      var tasksHTML = "";
			
			// Grab all Types of tasks in the db and create an array we can later sort
			DB = Object.keys(DB).map(function(key){
			    return DB[key];
			})

			// sort the DB based on the sort criteria (date or priority)
			DB = DB.sort(function(a, b){
					var keyA,keyB;

					//validate if we should sort by prioroty or date
					if(sortCriteria==='entryDate'){
				    keyA = new Date(a[sortCriteria])
				    keyB = new Date(b[sortCriteria]);
					}				
					else{
				    keyA = parseInt(a[sortCriteria])
				    keyB = parseInt(b[sortCriteria]);
					}
			    
			    if(keyA < keyB) return -1;
			    if(keyA > keyB) return 1;
			    return 0;
			});

    	// loop all the DB and create the HTML Elements
    	DB.map(function(task){ // create LI elements for every taks in every type
    		// append the HTML to the string we are going to use to create the UL for the UI
    		tasksHTML += `
    			<li class='task-link ${task.complete?'completed':''}' data-taskid='${task.id}' data-tasktype='${task.kind}'>
    				<div class="nav-left">
    				<a href="#compose2" >

    				<font color='${priorityColors[task.priority]}'>${task.desc}</font></a></div>
    				<font class="small-date"> Created on ${new Date(task.entryDate).toLocaleDateString("en-US")}</font>
    			</li>`;
    	})

      // append all elements to the task list html
      document.getElementById('taskList').innerHTML = tasksHTML;

			// get all task links and attach an event listener
			var taskLinks = Array.from(document.getElementsByClassName("task-link")); 

			// add click listeners to all tasks
			taskLinks.map(function(taskLink){
				taskLink.addEventListener('click', onTaskClick, false);
			});

			// after updating we reset all inputs and elements
			resetApp();
    }
		
	//(Self reminder review this method from mozilla)
    function resetApp(){
		// Reset Btns
    	// document.getElementById("editBtns").style="display:none";
    	// document.getElementById("addBtns").style="display:block";

    	// Reset all input values
      Array.from(document.getElementsByClassName("taskValue")).map((element)=>{
      	element.value = "";
      })

      Array.from(document.getElementsByClassName("btn-add")).map((btn)=>{
      	btn.style.display="block";
      })
      
      Array.from(document.getElementsByClassName("btn-crud")).map((btn)=>{
      	btn.style.display="none";
      })


      // trigger the click to the task list to show them all
      document.getElementById("TaskListNav").click(); 
    	selectedTask = null;

    }

    // CRUD HANDLERS

    // CREATE
    function onCreateAppt() {
      // Value of input tag
      var taskDesc = document.getElementById("ApptDesc").value;
      var taskID =  "appt-" + Math.floor((Math.random() * 190020) + 5);

      // Value for priority drop down
      var priority = document.getElementById('priorityDropDownAppt').value;

      if (taskDesc === "" || taskID ==="") {
        alert("No task entered or no ID - list not updated");
        return false
      }

      var complete = document.getElementById("completeBtnAppt").checked;
      

      var apptDate = document.getElementById("apptDate").value;
      var appTime = document.getElementById("apptTime").value;
      var appPlace = document.getElementById("apptPlace").value;
  		
  		var newTask = new Appt(taskID,taskDesc,priority,complete,new Date(),apptDate,appTime,appPlace);
  		newTask.create();
      refreshTasks();
    }

		function onCreateTask() {
      // Value of input tag
      var taskDesc = document.getElementById("TaskDesc").value;
      var taskID =  "task-" + Math.floor((Math.random() * 190020) + 5);

      // Value for priority drop down
      var priority = document.getElementById('priorityDropDownTask').value;
      // Value for task type drop down

      if (taskDesc === "" || taskID ==="") {
        alert("No task entered or no ID - list not updated");
        return false
      }

      var complete = document.getElementById("completeBtnTask").checked;
      var newTask;      
  		newTask = new Task(taskID,taskDesc,priority,complete,new Date());
  		newTask.create();
      refreshTasks();
    }

		function onCreateShopping() {
      // Value of input tag
      var taskDesc = document.getElementById("ShoppingDesc").value;
      var taskID =  "shopping-" + Math.floor((Math.random() * 190020) + 5);

      // Value for priority drop down
      var priority = document.getElementById('priorityDropDownShopping').value;
      // Value for task type drop down
     
      if (taskDesc === "" || taskID ==="") {
        alert("No task entered or no ID - list not updated");
        return false
      }

      var complete = document.getElementById("completeBtnShopping").checked;
      var newTask;

      var shoppingItems = document.getElementById("shoppingItems").value;
      var shoppingNotes = document.getElementById("shoppingNotes").value;
  		newTask = new Shopping(taskID,taskDesc,priority,complete,new Date(),shoppingItems,shoppingNotes);
  		newTask.create();
      refreshTasks();
    }

    //UPDATE
    function onUpdateClick(){
    	if (selectedTask){
	    	// using the static method to delete a task
	    	var updatedData = {}

	    	switch(selectedTask.kind){
	    		case "Appt":
	    			updatedData.desc = document.getElementById("ApptDesc").value;
	    			updatedData.priority = document.getElementById('priorityDropDownAppt').value;
	    			updatedData.dateDue = document.getElementById("apptDate").value;
	    			updatedData.timeDue = document.getElementById("apptTime").value;
	    			updatedData.place = document.getElementById("apptPlace").value;
	    			updatedData.complete = document.getElementById("completeBtnAppt").checked;
	    			break
	    		case "Task":
	    			updatedData.desc = document.getElementById("TaskDesc").value;
	    			updatedData.priority = document.getElementById('priorityDropDownTask').value;
	    			updatedData.complete=document.getElementById("completeBtnTask").checked;
	    			break
	    		case "Shopping":
	    			updatedData.desc = document.getElementById("ShoppingDesc").value;
	    			updatedData.priority = document.getElementById('priorityDropDownShopping').value;
	    			updatedData.complete=document.getElementById("completeBtnShopping").checked;
	    			updatedData.items=document.getElementById("shoppingItems").value;
	    			updatedData.notes=document.getElementById("shoppingNotes").value;
	    			break
	    	}

	    	selectedTask.update(updatedData)
	    	refreshTasks();
	    	resetApp();
    	}
    }

    // DELETE
    function onDeleteTask(){
    	if (selectedTask){
	    	// using the static method to delete a task
	    	selectedTask.delete()
	    	refreshTasks();
	    	resetApp();
    	}
    }
		//(Self reminder There is some sort've bug around here, clean up and try to figure out what's wrong)
    // CANCEL
    function onCancelClick(){
    	// when user clicks cancel, the app should refresh (should) not sure why this isn't working (bug)
    	resetApp();
    }

    function onTaskClick(){
    	// when a task is clicked, set the current task to be edited or deleted
    	var taskID = this.getAttribute("data-taskid");
    	var task = Task.read(taskID);
    	console.log(taskID,task)
    	var taskType = task.kind;
    	selectedTask = task;

    	// When you click a task, it triggers the click event from the navigation and shows the task form with the data of the selected task so we can update it
    	document.getElementById(taskType+"Nav").click(); 

    	// set the values of the inputs to the values from the selected task
      document.getElementById('priorityDropDown'+taskType).value = selectedTask.priority
      document.getElementById("completeBtn"+taskType).checked = selectedTask.complete;
      document.getElementById(taskType+"Desc").value = selectedTask.desc;

      if (taskType==='Appt') {
	      document.getElementById("apptDate").value = selectedTask.dateDue;
	      document.getElementById("apptTime").value = selectedTask.timeDue;
	      document.getElementById("apptPlace").value = selectedTask.place;

      }

      if(taskType==='Shopping'){
	      document.getElementById("shoppingItems").value = selectedTask.items;
				document.getElementById("shoppingNotes").value = selectedTask.notes;
      }

      	

      // Here i'm Updating a task, we dont need the "Create task btn" so therefore, hide it
      Array.from(document.getElementsByClassName("btn-add")).map((btn)=>{
      	btn.style.display="none";
      })

      // and only show the CRUD btns, update and delete

      Array.from(document.getElementsByClassName("btn-crud")).map((btn)=>{
      	btn.style.display="block";
      })      
      
    } 

    function onCompleteTask() {
    	//  check the complete btn 
    	// toggle the state if it is complete then it set to not complete and viceversa
    	if(selectedTask){
    		selectedTask.markComplete( !selectedTask.complete )
	    	refreshTasks();
	    	resetApp();
    	}

    }

    window.onload = function() {
    	// load tasks from the local storage
    	resetApp();
    	refreshTasks()


    	// attach click listeners to elements
    	document.getElementById("sortDropDown").addEventListener("change",refreshTasks)
      document.getElementById("addBtnAppt").addEventListener("click", onCreateAppt);
      document.getElementById("addBtnTask").addEventListener("click", onCreateTask);
      document.getElementById("addBtnShopping").addEventListener("click", onCreateShopping);

      document.getElementById("updateBtnAppt").addEventListener("click", onUpdateClick);
      document.getElementById("updateBtnTask").addEventListener("click", onUpdateClick);
      document.getElementById("updateBtnShopping").addEventListener("click", onUpdateClick);

      document.getElementById("deleteBtnAppt").addEventListener("click", onDeleteTask);
      document.getElementById("deleteBtnTask").addEventListener("click", onDeleteTask);
      document.getElementById("deleteBtnShopping").addEventListener("click", onDeleteTask);

      document.getElementById("cancelBtnAppt").addEventListener("click", onCancelClick);
      document.getElementById("cancelBtnTask").addEventListener("click", onCancelClick);
      document.getElementById("cancelBtnShopping").addEventListener("click", onCancelClick);

      document.getElementById("completeBtnAppt").addEventListener("click", onCompleteTask);
      document.getElementById("completeBtnTask").addEventListener("click", onCompleteTask);
      document.getElementById("completeBtnShopping").addEventListener("click", onCompleteTask);
    };


}());