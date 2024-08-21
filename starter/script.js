'use strict';

class Workout {
  // PUBLIC FIELDS
  date = new Date();
  // id = (Date.now() + '').slice(-10); //A unique identifier should be given to an object created. In the real world, a library is usually used to create good and unique id numbers. MAKE A RESEARCH ON THAT.
  constructor(coords, distance, duration, uniqueId) {
    //takes in the data that is common to both workouts(Running & Cycling)
    // this.date = ...
    this.id = uniqueId;
    this.coords = coords; //[lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  // PROTECTED METHOD
  static _generateDescription(type, date) {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const desc = `${type[0].toUpperCase()}${type.slice(1)} on ${
      months[date.getMonth()]
    } ${date.getDate()}`;

    return desc;
  }

  _setDescription() {
    this.description = Workout._generateDescription(this.type, this.date);
  }
}

//THESE OBJECTS WOULD BE USED TO CREATE OR RENDER THE WORKOUTS DATA ON THE MAP
// Creating the CHILD class from the PARENT class WORKOUT
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence, uniqueId) {
    super(coords, distance, duration, uniqueId);
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
  constructor(coords, distance, duration, elevation, uniqueId) {
    super(coords, distance, duration, uniqueId);
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
const titleColume = document.querySelector('.workout__title');

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
  #initZoomLevel = 3;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #workoutsMarkers = [];
  #tempMarker = null;
  #currentEditMarker = null;
  // Defining the click, map, mapZoomLevel, mapEvent and workouts properties/fields to be on the instance scope of the App object

  constructor() {
    //the constructor method is called immediately when a new object is created from the class

    // INIT MAP ONCE THE PAGE IS LOADED SO IT WON'T BE EMPTY EVEN IF USERS DENY TO GET CURRENT POSITION (just for better user experience)
    this._initMap();

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
    // formEdit.addEventListener('submit', this._newWorkout);

    deleteAllBtn.addEventListener('click', this._deleteAllWorkout.bind(this));
  }

  ////////////////// PROTECTED METHODS ////////////////////
  _click() {
    this.#click++;
  }

  // SET CURRENT DATA FOR EACH WORKOUT WHEN USER CLICK EDIT BUTTON
  _setEditForm(workout) {
    if (inputTypeForm.value != workout.type) {
      inputTypeForm.value = workout.type;

      const event = new Event('change', { bubbles: true });
      inputTypeForm.dispatchEvent(event);
    }

    inputDistanceForm.value = workout.distance;
    inputDurationForm.value = workout.duration;

    if (workout.type === 'running') {
      inputCadenceForm.value = workout.cadence;
    } else if (workout.type === 'cycling') {
      inputElevationForm.value = workout.elevation;
    }
  }

  _resetInputForm() {
    inputTypeForm.value = 'running';
    inputDistanceForm.value = '';
    inputDurationForm.value = '';
    if (inputCadenceForm) inputCadenceForm.value = '';
    if (inputElevationForm) inputElevationForm.value = '';
    // inputElevationForm?.value = "";
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

          this._setEditForm(workout);
        }
      });

      this.#currentEditMarker = event.target.dataset.id;
    }

    if (event.target.classList.contains('delete')) this._deleteWorkout(event);
  }

  // DELETE SINGLE WORKOUT
  _deleteWorkout(event) {
    const id = event.target.dataset.id;
    // DELETING FUNCTIONALITY
    // SEARCH FOR THE LIST ITEM TO DELETE, RETURN A NEW ARRAY OF THE FILTERED ARRAY
    if (event.target.classList.contains('delete')) {
      let deleteArray = this.#workouts.filter(
        work => work.id !== event.target.dataset.id
      );
      this.#workouts = deleteArray;

      // REMOVE LIST ELEMENT
      listElement.forEach(li => {
        if (li.classList.contains(`${event.target.dataset.id}--delete`)) {
          li.remove();
          this._setLocalStorage();
        }
      });
      event.target.remove(`btn--${event.target.dataset.id}--edit`);

      // REMOVE INDIVIDUAL MARKERS
      const workoutMarker = this.#workoutsMarkers.find(
        marker => marker.options.id === id
      );
      if (workoutMarker) {
        this.#map.removeLayer(workoutMarker);

        this.#workoutsMarkers = this.#workoutsMarkers.filter(
          marker => marker.options.id !== id
        );
      }
    }
    // location.reload();
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
        this._setMapView.bind(this),
        function () {
          //this._setMapView callBack function gets called when the location getting is not gotten
          alert('Could not get your position');
        }
      ); //this function here take as an input, two callback function, and the first one is a callback function that will be called on success i.e whenever the browser successfully get the cordinates of the current position of the user and the second call back is the arrow callback when there happen to be an error while getting the cordinates
  }

  _initMap() {
    this.#map = L.map('map').setView([0, 0], this.#initZoomLevel);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //make research on openstreetmap theme/Google theme map for code (EXPLORING THE APP)
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // this.#map = L.map('map').setView(coords, this.#mapZoomLevel); //the string 'map' will be the id set on the index.html where you want the map to be displayed
    //why are we storing the map in a variable called 'this.#map'?
    //it is onto the map object that we can add an eventListener. The map is a special object with a couple of methods/properties on it
    // console.log(map)
    // https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png

    //HANDLING CLICKS ON MAP
    this.#map.on('click', this._showForm.bind(this)); // the this keyword for the _showForm method will be set unto the object at which the function is called unless we set the this keyword by using the bind method so it points the #mapEvent. The 'this' keyword is the app object and so then, the (this).#mapEvent will also be the map object and that is where we have the #mapEvent property
    //the on() is coming from the leaflet library. it is a method from the map object

    // Rendering the workout from the workouts array if there are workouts on the array list
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _setMapView(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map.setView(coords, this.#mapZoomLevel);
  }

  _setTempMarker(lat, lng) {
    if (this.#tempMarker === null) {
      const iconStyle = L.icon({
        iconUrl: './mapicon.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
      this.#tempMarker = L.marker([lat, lng], { icon: iconStyle }).addTo(
        this.#map
      );
    } else {
      this.#tempMarker.setLatLng([lat, lng]);
    }
  }

  _removeTempMarker() {
    this.#map.removeLayer(this.#tempMarker);

    this.#tempMarker = null;
  }

  _showForm(mapE) {
    //placed on the _setMapView method
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    // inputDistance.focus();

    const { lat, lng } = this.#mapEvent.latlng;
    this._setTempMarker(lat, lng);

    // SET DEFAULT TYPE TO RUNNING
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

  _getFormData(isModalForm) {
    if (isModalForm) {
      return {
        type: inputTypeForm.value,
        distance: +inputDistanceForm.value,
        duration: +inputDurationForm.value,
        cadence: +inputCadenceForm?.value,
        elevation: +inputElevationForm?.value,
      };
    } else {
      return {
        type: inputType.value,
        distance: +inputDistance.value,
        duration: +inputDuration.value,
        cadence: +inputCadence?.value,
        elevation: +inputElevation?.value,
      };
    }
  }

  _createWorkout(data, coords, uniqueId) {
    const workoutTypes = {
      running: () =>
        new Running(
          coords,
          data.distance,
          data.duration,
          data.cadence,
          uniqueId
        ),
      cycling: () =>
        new Cycling(
          coords,
          data.distance,
          data.duration,
          data.elevation,
          uniqueId
        ),
    };

    const createFunc = workoutTypes[data.type];
    return createFunc ? createFunc() : null;
  }

  _addNewWorkout(formData) {
    const { lat, lng } = this.#mapEvent.latlng;
    const uniqueId = crypto.randomUUID();
    const workout = this._createWorkout(formData, [lat, lng], uniqueId);

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(this.#workouts, 'WORKOUT ARRAY');

    // Remove TempMarker on the map
    this._removeTempMarker();

    // Render workout on map as marker
    this._renderWorkoutMarker(workout, uniqueId);

    // Render Workout on list
    this._renderWorkout(workout);

    // Hide the form + Clear input fields
    this._hideForm();
  }

  _updateExistingWorkout(formData) {
    this._hideModalForm();
    const workout = this._updateWorkoutData(formData);
    if (workout) {
      //UPDATE MARKER POPUP
      this._updateMarkerPopup(workout);

      // UPDATE SIDEBAR WORKOUT INFORMATION
      this._updateListItem(workout, formData);

      // RESET INPUT FORM
      this._resetInputForm();
    }
  }

  _updateMarkerPopup(workout) {
    const work = this.#workouts.find(
      work => work.id === this.#currentEditMarker
    );
    // GET POPUP DESCRIPTION FROM WORKOUT FUNCTION (REUSABLE)
    const desc = Workout._generateDescription(
      workout.type,
      new Date(work?.date)
    );

    work.description = desc;

    const workMarker = this.#workoutsMarkers.find(
      marker => marker.options.id === this.#currentEditMarker
    );

    if (workMarker) {
      let contentImage = '';

      if (workout.type === 'running') {
        contentImage = '🏃‍♂️';
        workMarker._popup._container.classList.add('running-popup');
        workMarker._popup._container.classList.remove('cycling-popup');
      } else {
        contentImage = '🚵';
        workMarker._popup._container.classList.remove('running-popup');
        workMarker._popup._container.classList.add('cycling-popup');
      }

      workMarker._popup.setContent(`${contentImage} ${desc}`);
    }
  }

  _updateWorkoutData(formData) {
    const workout = this.#workouts.find(
      work => work.id === this.#currentEditMarker
    );
    if (!workout) return null;

    const { distance, duration, type } = formData;
    const pace = duration / distance;
    const speed = distance / (duration / 60);

    if (type === 'running') {
      Object.assign(workout, {
        ...workout,
        type: 'running',
        pace,
        distance: formData.distance,
        duration: formData.duration,
        cadence: formData.cadence,
      });
      delete workout.speed;
      delete workout.elevation;
    } else {
      Object.assign(workout, {
        ...workout,
        type: 'cycling',
        speed,
        distance: formData.distance,
        duration: formData.duration,
        elevation: formData.elevation,
      });
      delete workout.pace;
      delete workout.cadence;
    }

    return workout;
  }

  _updateListItem(workout, formData) {
    const listItem = this._findListItem(workout.id);
    if (!listItem) return;

    const elements = this._getListItemElements(listItem);
    this._updateListItemContent(elements, formData, workout);
  }

  _findListItem(id) {
    return [...listElement].find(item => item.dataset.id === id);
  }

  _getListItemElements(listItem) {
    return {
      title: listItem.querySelector('workout__title'),
      distance: listItem.querySelector('.workout__distance'),
      duration: listItem.querySelector('.workout__duration'),
      speed: listItem.querySelector('.workout__speed'),
      pace: listItem.querySelector('.workout__pace'),
      cadence: listItem.querySelector('.workout__cadence'),
      elevation: listItem.querySelector('.workout__elevation'),
      icon: listItem.querySelector('.workout__icon'),
    };
  }

  _updateListItemContent(elements, formData, workout) {
    let workData = this.#workouts.find(
      work => work.id === this.#currentEditMarker
    );
    workData = workout;

    console.log(workData);
    // REMOVE THE LIST AND REDRAW IT
    listElement.forEach(li => {
      li.remove();
    });
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _hideModalForm() {
    modalForm.classList.add('hidden');
    overlayForm.classList.add('hidden');
  }

  _addListItemEventListeners() {
    listElement.forEach(li => {
      li.removeEventListener('click', this._editWorkout);
      li.addEventListener('click', this._editWorkout.bind(this));
    });
  }

  _newWorkout(event) {
    //place as a callback function to form eventListener at the constructor
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); // the every array method checks for all the elements of the array and returns a boolean. If all elements pass, then it returns true, if one fails and the rest passes, it returns false

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    event.preventDefault();

    const checkValidation = ({
      type,
      distance,
      duration,
      cadence,
      elevation,
    }) => {
      const commonInputs = [distance, duration];
      const specificInput = type === 'running' ? cadence : elevation;

      if (!validInputs(...commonInputs, specificInput)) {
        return false;
      }

      if (!allPositive(...commonInputs)) {
        return false;
      }

      if (type === 'running' && !allPositive(cadence)) {
        return false;
      }

      return true;
    };

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
    const isModalForm = event.target.classList.contains('modal-form');
    const formData = this._getFormData(isModalForm);

    // CHECK VALIDATION
    if (!checkValidation(formData)) {
      return this._toggleErrorMessage(formData.type);
    }

    // CHECK TYPE >>  ADD OR EDIT
    if (!isModalForm) {
      this._addNewWorkout(formData);
    } else {
      this._updateExistingWorkout(formData);
    }

    this._addListItemEventListeners();
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout, uniqueId) {
    const marker = L.marker(workout.coords, {
      id: uniqueId,
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

    this.#workoutsMarkers.push(marker);
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
          <span class="workout__value workout__distance" >${
            workout.distance
          }</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value workout__duration">${
            workout.duration
          }</span>
          <span class="workout__unit">min</span>
        </div>
      `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value workout__pace">${workout.pace.toFixed(
            1
          )}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value workout__cadence">${
            workout.cadence
          }</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
    `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value workout__speed">${workout.speed.toFixed(
            1
          )}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value workout__elevation">${
            workout.elevation
          }</span>
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
      this._renderWorkoutMarker(work, work.id);
      // this._renderWorkoutMarker(work); // Why would this not work? Remember that the _getLocalStorage is executed right at the begining, right after the page loaded, and so the _renderWorkoutMarker(work) is trying to be called right at the beginning, however at this point, map has actually not be loadede and essentially we are trying to add a marker to the map which is not yet defined
    });
    console.log('PAGE LOADED SUCCESSFULLY USING the _getLocaleStorage method');
  }

  _toggleErrorMessage() {
    overlayForm.classList.toggle('hidden');
    errorModal.classList.toggle('hidden');
    console.log(overlayForm.classList);
    console.log(errorModal.classList);
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
