import React from 'react';
import ReactDOM from 'react-dom';
import Map from 'google-maps-react';
import AutocompleteInput from './autocomplete.jsx';
import {GoogleApiWrapper, Marker, InfoWindow} from 'google-maps-react';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import PinCreator from './pincreator.jsx';
import Popover from 'material-ui/Popover';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import DatePicker from 'material-ui/DatePicker';
import TimePicker from 'material-ui/TimePicker';
// import FloatingSearchButton from 'material-ui/FloatingActionButton';
import Sherlock from 'material-ui/svg-icons/action/search';
import TextField from 'material-ui/TextField';
import Menu from 'material-ui/Menu';
import GOOGLE_API_KEY from '../google/google.js';
import MenuItem from 'material-ui/MenuItem';
import PinSelection from './pindrawer.jsx';
import style from './style.js';

export class MapContainer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      drawerIsOpen: true,
      dialongOpen: false,
      searchIsOpen: false,
      pin: false,
      centerAroundCurrentLocation: true,
      currentPlace: {},
      markerOn: false,
      eventName: '',
      eventDate: null,
      eventTime: null
    };

    this.marker = {};

    this.handleDialogSubmit = this.handleDialogSubmit.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
    this.handleEventNameChange = this.handleEventNameChange.bind(this);
    this.handleEventDateChange = this.handleEventDateChange.bind(this);
    this.handleEventTimeChange = this.handleEventTimeChange.bind(this);
  }

  centerMoved(mapProps, map) {
    this.props.updateCenter(map.getCenter());
  }

  searchLocation(place, map) {
    if (!place.geometry) { return; }
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
    this.props.updateCenter(window.map.getCenter());
    this.props.updateZoom(window.map.getZoom());
  }

  // handleMarkerClicker(index) {
  //   this.props.setCurrPin(index);
  // }

  handleClick(mapProps, map, clickEvent) {
    if (this.state.markerOn) {
      this.marker = {
        position: clickEvent.latLng,
        icon: {}
      };
      this.setState({ dialongOpen: true });
    }
  }

  handleDialogSubmit() {
    if (this.state.markerOn) {
      this.marker.eventName = this.state.eventName;
      this.marker.eventDate = this.state.eventDate.toDateString();
      this.marker.eventTime = this.state.eventTime.toLocaleTimeString();

      this.props.addMarker(this.marker);
      this.setState({
        dialongOpen: false,
        markerOn: false
      }, () => this.marker = {});
    }
  }

  handleDialogClose() {
    this.setState({ dialongOpen: false, markerOn: false });
  }

  handleEventNameChange(e) {
    this.setState({ eventName: e.target.value });
  }

  handleEventDateChange(e, date) {
    console.log(typeof date);
    this.setState({ eventDate: date });
  }

  handleEventTimeChange(e, time) {
    this.setState({ eventTime: time });
  }

  mapReady(mapProps, map) {
    window.map = map;
    this.props.updateCenter(this.props.currentCenter);
    map.setZoom(this.props.zoom);
    map.setCenter(this.props.currentCenter);
    map.addListener('zoom_changed', ()=>{
      this.props.updateZoom(map.getZoom());
    });
  }

  handleSearchTap(event) {
    event.preventDefault();
    this.setState({
      searchIsOpen: !this.state.searchIsOpen,
      searchAnchorEl: event.currentTarget
    });
  }

  handleRequestClose() {
    this.setState({ searchIsOpen: false });
  }

  selectPin(pin) {
    this.setState({
      markerOn: true,
      currentIcon: pin
    });
  }

  render() {
    if (!this.props.loaded) {
      return (
        <RefreshIndicator
          size={40}
          left={10}
          top={0}
          status='loading'
          style={style.mapContainer.refresh}
        />
      );
    }

    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onTouchTap={this.handleDialogClose}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        onTouchTap={this.handleDialogSubmit}
      />,
    ];

    return (
      <div>
        <AutocompleteInput
          google={this.props.google}
          searchPlace={this.searchLocation.bind(this)}
        />
        <div id="map_container">
          <Map google={this.props.google}
            onClick={this.handleClick.bind(this)}
            onReady={this.mapReady.bind(this)}
            onDragend={this.centerMoved.bind(this)}
            zoom={this.props.zoom}
          >
            {this.props.markers.map((marker, index) => {
              return (
                <Marker
                  // onClick={() => { this.handleMarkerClicker(index); }}
                  key={index}
                  position={marker.position}
                  iconStyle={marker.icon}
                  name={{
                    eventName: marker.eventName,
                    eventDate: marker.eventDate,
                    eventTime: marker.eventTime
                  }}
                  onMouseover={this.props.onMouseOverMarker}
                />
              );
            })}
            <InfoWindow
              marker={this.props.activeMarker}
              visible={this.props.showInfoWindow}
              onClose={this.props.onInfoWindowClose}
            >{this.props.selectedPlace.name ?
                <div>
                  <h2>{this.props.selectedPlace.name.eventName || 'No info'}</h2>
                  <h4>{this.props.selectedPlace.name.eventDate}</h4>
                  <h4>{this.props.selectedPlace.name.eventTime}</h4>
                </div> : <div></div>
              }
            </InfoWindow>
          </Map>
          <PinSelection
            onPinClick={this.selectPin.bind(this)}
          />
        </div>
        <Dialog
          title="Please enter event info"
          actions={actions}
          modal={true}
          open={this.state.dialongOpen}
          onRequestClose={this.handleDialogClose}
        >
          <TextField
            id="text-field-controlled"
            value={this.state.eventName}
            onChange={this.handleEventNameChange}
          />
          <DatePicker
            hintText="Pick a date"
            container="inline"
            autoOk={true}
            onChange={this.handleEventDateChange}
          />
          <TimePicker
            format="ampm"
            hintText="12hr Format"
            autoOk={true}
            value={this.state.eventTime}
            onChange={this.handleEventTimeChange}
          />
        </Dialog>
      </div>
    );
  }
}

// export default MapContainer;
export default GoogleApiWrapper({
  apiKey: GOOGLE_API_KEY
})(MapContainer);
