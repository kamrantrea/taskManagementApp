(function() {

		var selectedTask = null; // this is set when you click in a task

		function checkLocalStorage(){
			// Checks if localstorage works on the browser
			return typeof localStorage !== 'undefined'
		}

		function saveToDB(kind,id,item){
			// Creates a string from JSON we can store in localstorage to parse later
			var taskDB = getDB();
			taskDB[kind] = taskDB[kind] || {};
			taskDB[kind][id] = item;
			var updatedDB = JSON.stringify(taskDB)
			localStorage.setItem('taskDB',updatedDB);
		}

		function deleteFromDB(kind,id){
			var taskDB = getDB();
			delete taskDB[kind][id];
			var updatedDB = JSON.stringify(taskDB)
			localStorage.setItem('taskDB',updatedDB);
		}
		
		function getDB(){
			var db = localStorage.getItem('taskDB')
			return JSON.parse(db) || {};
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
			}

			static create(task){
				saveToDB('Task',task.id,task)
			}

			static read(id){
				if( checkLocalStorage() ){
					var DB = getDB()
					return DB['task'][id];
				}
			}

			update(desc,priority,complete){
				this.desc = desc;
				this.priority = priority;
				this.complete = complete;
			}

			static delete(kind,id){
				deleteFromDB(kind,id);
			}
		}

		class Appt extends Task{
			constructor(id,desc,priority,complete,entryDate,dateDue,timeDue,place){
				super(id,desc,priority,complete,entryDate);
				this.dateDue = dateDue;
				this.timeDue = timeDue;
				this.place = place;
			}

			static create(task){
				saveToDB('Appt',task.id,task)
			}

			static read(id){
				if( checkLocalStorage() ){
					var DB = getDB()
					return DB['Appt'][id];
				}
			}

			update(desc,priority,complete,dateDue,timeDue,place){
				super.update(desc,priority,complete);
				this.dateDue = dateDue;
				this.timeDue = timeDue;
				this.place = place;
			}
		}

		class Shopping extends Task{
			constructor(id,desc,priority,complete,entryDate,items,notes){
				super(id,desc,priority,complete,entryDate);
				this.items = items;
				this.notes = notes;
			}

			static create(task){
				saveToDB('Shopping',task.id,task)
			}

			static read(id){
				if( checkLocalStorage() ){
					var DB = getDB()
					return DB['Shopping'][id];
				}
			}

			update(desc,priority,complete,items,notes){
				super.update(desc,priority,complete);
				this.items = items;
				this.notes = notes;
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

    function onTaskClick(){
    	// when a task is clicked, set the current task to be edited or deleted
    	var taskID = this.getAttribute("data-taskid");
    	var taskType = this.getAttribute("data-tasktype");
    	var DB = getDB()
    	selectedTask = DB[taskType][taskID];
    	selectedTask.kind = taskType;
    	document.getElementById("editBtns").style="display:block";
    	document.getElementById("addBtns").style="display:none";
    

    	// set the values of the inputs to the values from the selected task
      document.getElementById("completeBtn").checked = selectedTask.complete;

      document.getElementById("taskDesc").value = selectedTask.desc;
      document.getElementById("taskID").value = selectedTask.id;
      document.getElementById("shoppingItems").value = selectedTask.items;
			document.getElementById("shoppingNotes").value = selectedTask.notes;
      document.getElementById("apptDate").value = selectedTask.dateDue;
      document.getElementById("apptTime").value = selectedTask.timeDue;
      document.getElementById("apptPlace").value = selectedTask.place;
      document.getElementById('priorityDropDown').value = selectedTask.priority
    }

    function refreshTasks(){
    	// Colors for the priority
    	var priorityColors = {1:"red",2:"orange",3:"green"};
    	
    	// gets all the tasks from the DB and shows them
    	var DB = getDB();

    	// String to update html
      var tasksHTML = "";

      Object.entries(DB).map(function(taskType){
      	// Grab all Types of tasks in the db
      	Object.entries(taskType[1]).map(function(task){ // create LI elements for every taks in every type
      		var task = task[1];
      		tasksHTML += `
      			<li class='task ${task.complete?'completed':''}' data-taskid='${task.id}' data-tasktype='${taskType[0]}'>
      				<font color='${priorityColors[task.priority]}'>${task.desc}</font>
      				<font class="small-date"> Created on ${task.entryDate}</font>
      			</li>`;
      	})
      })

      // append all elements to the task list html
      document.getElementById('taskList').innerHTML = tasksHTML;
			var taskLinks = Array.from(document.getElementsByClassName("task"));

			// add click listeners to all tasks
			taskLinks.map(function(taskLink){
				taskLink.addEventListener('click', onTaskClick, false);
			});

			// after updating we reset all inputs and elements
			resetApp();
    }

    // Click Handlers
    function onCreateClick() {
      // Value of input tag
      var taskDesc = document.getElementById("taskDesc").value;
      var taskID = document.getElementById("taskID").value;

      // Value for priority drop down
      var priority = document.getElementById('priorityDropDown').value;
      // Value for task type drop down
      var taskType = document.getElementById('taskTypeDropDown').value;


      if (taskDesc === "" || taskID ==="") {
        alert("No task entered or no ID - list not updated");
        return false
      }

      var complete = document.getElementById("completeBtn").checked;
      console.log(complete)
      var newTask;

      switch(taskType){
      	case "Appt":
		      var apptDate = document.getElementById("apptDate").value;
		      var appTime = document.getElementById("apptTime").value;
		      var appPlace = document.getElementById("apptPlace").value;
      		newTask = new Appt(taskID,taskDesc,priority,complete,new Date(),apptDate,appTime,appPlace);
      		Appt.create(newTask);
      		break;
      	case "Shopping":
		      var shoppingItems = document.getElementById("shoppingItems").value;
		      var shoppingNotes = document.getElementById("shoppingNotes").value;
      		newTask = new Shopping(taskID,taskDesc,priority,complete,new Date(),shoppingItems,shoppingNotes);
      		Shopping.create(newTask);
      		break;
      	default:
      		newTask = new Task(taskID,taskDesc,priority,complete,new Date());
      		Task.create(newTask);
      		break;
      }

      refreshTasks();
    };

    function onDeleteClick(){
    	if (selectedTask){
	    	// use the static method to delete a task
	    	Task.delete(selectedTask.kind,selectedTask.id)
	    	refreshTasks();
	    	resetApp();
    	}
    }

    function onCancelClick(){
    	resetApp();
    }

    function resetApp(){
    	// Reset Btns
    	document.getElementById("editBtns").style="display:none";
    	document.getElementById("addBtns").style="display:block";

    	// Reset all input values
      document.getElementById("taskDesc").value = "";
      document.getElementById("taskID").value = "";
      document.getElementById("shoppingItems").value = "";
			document.getElementById("shoppingNotes").value = "";
      document.getElementById("apptDate").value = "";
      document.getElementById("apptTime").value = "";
      document.getElementById("apptPlace").value = "";

    	selectedTask = null;

    }
    window.onload = function() {
    	// load tasks from the local storage
    	refreshTasks()

    	// attach click listeners to elements
      document.getElementById("addBtn").addEventListener("click", onCreateClick);
      document.getElementById("updateBtn").addEventListener("click", onCreateClick);
      document.getElementById("deleteBtn").addEventListener("click", onDeleteClick);
      document.getElementById("cancelBtn").addEventListener("click", onCancelClick);


      //listen for the change event in the task type, and based on this show other options
      document.getElementById("taskTypeDropDown").addEventListener("change", selectTaskType);
      
      // hide task options and show them until the dropdown changes
      document.getElementById('apptOpts').style="display:none";
      document.getElementById('shoppingOpts').style="display:none";
      document.getElementById("editBtns").style="display:none";
    };


}());