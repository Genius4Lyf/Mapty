'use strict';

class Workout {
  // PUBLIC FIELDS
  date = new Date();
  id = (Date.now() + '').slice(-10); //A unique identifier should be given to an object created. In the real world, a library is usually used to create good and unique id numbers. MAKE A RESEARCH ON THAT.
  constructor(coords, distance, duration) {
    //takes in the data that is common to both workouts(Running & Cycling)
    // this.date = ...
    // this.id = ...
    this.coords = coords; //[lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  // PROTECTED METHOD
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

//THESE OBJECTS WOULD BE USED TO CREATE OR RENDER THE WORKOUTS DATA ON THE MAP
// Creating the CHILD class from the PARENT class WORKOUT
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    // this.type = 'running' => thesame thing as writing it outside the constructor
    this.calcPace(); //the constructor will call the function
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Creating the CHILD class from the PARENT class WORKOUT
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    //this.cycling = 'cycling' => thesame thing as writing it outside the constructor
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// USED IN CHECKING IF OUR OBJECTS WERE CREATED
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const modal = document.querySelector('.modal');
const errorModal = document.querySelector('.error-modal');
const btnCloseModal = document.querySelector('.btn--close-modal');
const overlayModal = document.querySelector('.overlay');
const textField = document.getElementById('textField');
const body = document.querySelector('body');
const overlayForm = document.querySelector('.overlay-form');
const modalForm = document.querySelector('.modal-form');
const deleteAllBtn = document.querySelector('.btn-all');

// EDIT FORM SELECTOR
const formEdit = document.querySelector('.modal-form');
const inputTypeForm = document.querySelector('.form__input--type-edit');
const inputDistanceForm = document.querySelector('.form__input--distance-edit');
const inputDurationForm = document.querySelector('.form__input--duration-edit');
const inputCadenceForm = document.querySelector('.form__input--cadence-edit');
const inputElevationForm = document.querySelector(
  '.form__input--elevation-edit'
);

let listElement;
let formElement;

class App {
  // PRIVATE FIELDS
  #click = 0;
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  // Defining the click, map, mapZoomLevel, mapEvent and workouts properties/fields to be on the instance scope of the App object

  constructor() {
    //the constructor method is called immediately when a new object is created from the class
    // GET USER'S POSITION
    this._getPosition();

    // GET DATA FROM LOCAL STORAGE
    this._getLocalStorage();

    // ATTACH EVENT HANDLERS
    form.addEventListener('submit', this._newWorkout.bind(this)); //what will the 'this' keyword be like in this function eventHandler function? An eventHandler function will always have the this keyword of the DOM element unto which it is attached and in this case, that is going to be the form element, so inside of the 'this._newWorkout method, the 'this' keyword is going to point to form and no longer to the app object and once again, we need to fix that to with the bind
    formEdit.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField); //this event doesn't need to bind the 'this' keyword as it does not use it on the _toggleElevationField

    inputTypeForm.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this)); // the event listener will be added as the page loads

    btnCloseModal.addEventListener(
      'click',
      this._toggleErrorMessage.bind(this)
    );

    document.addEventListener('keydown', this._closeForm.bind(this));

    if (listElement) {
      listElement.forEach(li => {
        li.addEventListener('click', this._editWorkout.bind(this));
      });
    }

    // STILL WORKING ON THIS(ACTION ITEM YET TO BE COMPLETED)
    formEdit.addEventListener('submit', this._newWorkout);

    deleteAllBtn.addEventListener('click', this._deleteAllWorkout.bind(this));
  }

  ////////////////// PROTECTED METHODS ////////////////////
  _click() {
    this.#click++;
  }

  _editWorkout(event) {
    event.preventDefault();
    console.log(event.target);
    console.log(event.target.dataset.id);

    if (event.target.classList.contains('list--elements')) return;

    if (event.target.classList.contains('edit')) {
      // EDITING FUNCTIONALITY
      this.#workouts.forEach(workout => {
        // GETTING THE ID OF THE LIST ITEM TO BE EDITED
        if (event.target.classList.contains(`btn--${workout.id}--edit`)) {
          // console.log(workout.id);
          // HIDING THE LIST TO BE EDITED
          // listElement.forEach(li => {
          //   if (li.classList.contains(`${workout.id}`))
          //     li.classList.add('hidden');
          //   this._showForm();
          // });
          // INSERTING THE FORM TO EDIT THE WORKOUT SELECTED
          modalForm.classList.remove('hidden');
          overlayForm.classList.remove('hidden');
          // NEW DATE WILL BE CREATED AND THE ID WILL BE CHANGED
          // NEW FORM WILL OVERIDE THE EXISTING DATA OF THE OLD FORM
        }
      });
    }

    if (event.target.classList.contains('delete')) this._deleteWorkout(event);
  }

  _deleteWorkout(event) {
    console.log(this.#workouts);
    // DELETING FUNCTIONALITY
    // SEARCH FOR THE LIST ITEM TO DELETE, RETURN A NEW ARRAY OF THE FILTERED ARRAY
    if (event.target.classList.contains('delete')) {
      let deleteArray = this.#workouts.filter(
        work => work.id !== event.target.dataset.id
      );
      this.#workouts = deleteArray;
      listElement.forEach(li => {
        if (li.classList.contains(`${event.target.dataset.id}--delete`)) {
          li.remove();
          this._setLocalStorage();
        }
      });
      // event.target.remove(`btn--${event.target.dataset.id}--edit`);
    }
    location.reload();
  }

  _deleteAllWorkout(event) {
    console.log(this.#workouts);
    if (listElement) {
      listElement.forEach(li => {
        if (li.classList.contains(`workout`)) {
          this.#workouts = this.#workouts.splice(0, this.#workouts.length - 1);
          console.log(this.#workouts, 'ALL WORKOUTS HAS BEEN DELETED ARRAY');
          li.remove();
          this._setLocalStorage();
        }
      });
      location.reload();
    }
  }

  _getPosition() {
    // in order to trigger the geolocation api, this method _getPosition() needs to be called
    //inside of the class, we have a method that automatically gets called as the page loads and that is putting the _getPosition method on the constructor
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          //this._loadMap callBack function gets called when the location getting is not gotten
          alert('Could not get your position');
        }
      ); //this function here take as an input, two callback function, and the first one is a callback function that will be called on success i.e whenever the browser successfully get the cordinates of the current position of the user and the second call back is the arrow callback when there happen to be an error while getting the cordinates
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); //the string 'map' will be the id set on the index.html where you want the map to be displayed
    //why are we storing the map in a variable called 'this.#map'?
    //it is onto the map object that we can add an eventListener. The map is a special object with a couple of methods/properties on it
    // console.log(map)
    // https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //make research on openstreetmap theme/Google theme map for code (EXPLORING THE APP)
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //HANDLING CLICKS ON MAP
    this.#map.on('click', this._showForm.bind(this)); // the this keyword for the _showForm method will be set unto the object at which the function is called unless we set the this keyword by using the bind method so it points the #mapEvent. The 'this' keyword is the app object and so then, the (this).#mapEvent will also be the map object and that is where we have the #mapEvent property
    //the on() is coming from the leaflet library. it is a method from the map object

    // Rendering the workout from the workouts array if there are workouts on the array list
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    //placed on the _loadMap method
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    // inputDistance.focus();
  }

  _hideForm() {
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ''; //Empty fields
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField(event) {
    // placed as a callback function to the inputType eventListener at constructor
    console.log(event.target);
    // prettier-ignore
    if (event.target.classList.contains('form__input--type'))
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');

    // prettier-ignore
    if(event.target.classList.contains('form__input--type-edit'))
    inputElevationForm.closest('.form__row').classList.toggle('form__row--hidden');
    // prettier-ignore
    inputCadenceForm.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(event) {
    let type;
    let distance;
    let duration;
    console.log(event.target);
    //place as a callback function to form eventListener at the constructor
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); // the every array method checks for all the elements of the array and returns a boolean. If all elements pass, then it returns true, if one fails and the rest passes, it returns false

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    // console.log(this);
    event.preventDefault();

    // const formType = formInputType.value;
    // const formDistance = formInputDistance.value;
    // const formDuration = formInputDuration.value;
    // const formCadence = formInputCadence.value;
    // const formElevation = formInputElevation.value;

    // console.log(
    //   formType,
    //   formDistance,
    //   formDuration,
    //   formCadence
    //   // formElevation
    // );

    // Get Data from form Edit
    // if(event.target.classList.contains('form__input--type-edit')){}
    // const typeForm = inputTypeForm.value;
    // const distanceForm = +inputDistanceForm.value;
    // const durationForm = +inputDurationForm.value;
    // console.log(typeForm, distanceForm, durationForm);

    // Get Data from form
    if (event.target.classList.contains('modal-form')) {
      type = inputTypeForm.value;
      distance = +inputDistanceForm.value;
      duration = +inputDurationForm.value;
      console.log(type, distance, duration, 'EDIT FORM');
    } else {
      type = inputType.value;
      distance = +inputDistance.value;
      duration = +inputDuration.value;
      console.log(type, distance, duration, 'NORMAL FORM');
    }

    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    textField.focus();
    // if workout running, create running object
    if (type === 'running') {
      // Check if Data is valid
      const cadence = +inputCadence.value;
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence) // this was done first but in order to make it cleaner, a function validInputs was created to check for all the numbers
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        // if validInputs returns true, it will then be inverted to false, then then the 'return alert' code does not run at all, but it validInputs returns false, it will be inverted to true, the the 'retun alert() code runs
        return this._toggleErrorMessage(type);

      //using a guard claus means, is that we will basically check for the opposite of what we are originally interested in and if that opposite is true, then we simply return the function immediately

      // create running object
      workout = new Running([lat, lng], distance, duration, cadence);
      console.log(workout, 'RUNNING');
    }

    // if workout cycling, create cycling object
    if (type === 'cycling') {
      // Check if Data is valid
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        // if validInputs returns true, it will then be inverted to false, then then the 'return alert' code does not run at all, but it validInputs returns false, it will be inverted to true, the the 'retun alert() code runs
        return this._toggleErrorMessage(type);
      //using a guard claus means, is that we will basically check for the opposite of what we are originally interested in and if that opposite is true, then we simply return the function immediately

      // create cycling object
      workout = new Cycling([lat, lng], distance, duration, elevation);
      console.log(workout, 'CYCLING');
    }

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(this.#workouts, 'WORKOUT ARRAY');

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render Workout on list
    this._renderWorkout(workout);

    // Hide the form + Clear input fields
    this._hideForm();

    // set locale storage to all workouts
    this._setLocalStorage();

    listElement.forEach(li => {
      li.addEventListener('click', this._editWorkout.bind(this));
    });
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords, {
      keyboard: true,
      riseOnHover: true,
      draggable: true,
    })
      .addTo(this.#map) //notice here we called the 'this' keyword without using the bind method and that is because, we are calling this method directly and not as a callBack function
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          closeOnEscapeKey: false,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚵'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="list--elements ${workout.type} ${
      workout.id
    }--delete workout workout--${workout.type} ${workout.id}" data-id="${
      workout.id
    }">
      <div style="display: flex; align-items: space-evenly">
          <button class="btn-fnc btn--${workout.id}--edit edit" data-id="${
      workout.id
    }">📝</button>
          <button class="btn-fnc btn--${workout.id}--delete delete" data-id="${
      workout.id
    }">❎</button>
        </div>
        <h2 class="workout__title" style= "display: inline-block; max-width: 50%">${
          workout.description
        }</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚵'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
      `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
    `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">m</span>
        </div>
    `;

    form.insertAdjacentHTML('afterend', html);

    listElement = document.querySelectorAll('.list--elements');
    // listElement.addEventListener('click', function (event) {
    //   event.preventDefault();
    //   console.log(event.target);
    // });
  }

  _moveToPopup(event) {
    const workoutEl = event.target.closest('.workout'); //Closest is very useful because... when we click on the element, we get the entire element and it is so important because it is right there we have the 'id' and it is that 'id' to actually find the workout in the workout array
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using public interface => we interact with the object using their public interface
    // workout.clicks();
    this._click();
    console.log(this.#click);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data; // This method (_getLocalStorage is going to be executed right from the beginning and so at that point, the #workout array is goint to be empty but if we already have some data on the localStorage, then we will simply set that workout array to the data that we had before and so essentially, we are restoring the data across multiple reloads of the page)
    console.log(
      this.#workouts,
      'WORKOUT ARRAY GOTTEN FROM THE LOCALE STORAGE WITHOUT ANY PROTOTYPE'
    );
    // SETTING THE OBJECTS THAT WAS FETCHED FROM LOCALE STORAGE TO OWN THE PROTOTYPE OF THE WORKOUT CLASS
    const newWorkoutObject = [];
    this.#workouts.forEach(workout => {
      if (workout.type === 'running') {
        workout = new Running(
          workout.coords,
          workout.distance,
          workout.duration,
          workout.cadence
        );
      }

      if (workout.type === 'cycling') {
        workout = new Cycling(
          workout.coords,
          workout.distance,
          workout.duration,
          workout.cadence
        );
      }
      newWorkoutObject.push(workout);
    });
    console.log(
      this.#workouts,
      'OBJECTS THAT HAS BEEN CONVERTED AT the _getLocaleStorage Method'
    );
    // this.#workouts = newWorkoutObject;
    // console.log(this.#workouts);

    // Rendering the workout in the list
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      // this._renderWorkoutMarker(work); // Why would this not work? Remember that the _getLocalStorage is executed right at the begining, right after the page loaded, and so the _renderWorkoutMarker(work) is trying to be called right at the beginning, however at this point, map has actually not be loadede and essentially we are trying to add a marker to the map which is not yet defined
    });
    console.log('PAGE LOADED SUCCESSFULLY USING the _getLocaleStorage method');
  }

  _toggleErrorMessage() {
    errorModal.classList.toggle('hidden');
    overlayForm.classList.toggle('hidden');
  }

  _closeForm(event) {
    // console.log(this);
    if (event.key === 'Escape' && !form.classList.contains('hidden')) {
      form.classList.add('hidden');
    }

    if (event.key === 'Escape' && !formEdit.classList.contains('hidden')) {
      formEdit.classList.add('hidden');
      overlayForm.classList.add('hidden');
    }
  }

  // PUBLIC INTERFACE/PUBLIC METHOD/PUBLIC API
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App(); //this app object that is created right in the begining when the page loads and that means that the constructor is also created immediately as the page loads. Why? all the code on the gloabal variable is run so the new App object is created at the run of the website
console.log(app);
