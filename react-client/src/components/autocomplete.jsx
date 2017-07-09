import React from 'react';
import ReactDOM from 'react-dom';
import MenuItem from 'material-ui/MenuItem';
import AutoComplete from 'material-ui/AutoComplete';

class Autocomplete extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      locations: []
    };
  }

  componentDidUpdate(prevProps) {
    const {google} = this.props;
    const map = window.map;
    if (map !== prevProps.map) {
      this.renderAutoComplete();
    }
  }

  componentDidMount() {
    this.renderAutoComplete();
  }

  renderAutoComplete() {
    const {google} = this.props;
    const map = window.map;
    if (!google || !map) { return; }

    const autocompleteRef = this.refs.autocomplete;
    const autocompleteNode = ReactDOM.findDOMNode(autocompleteRef);
    var autocomplete = new google.maps.places.Autocomplete(autocompleteNode);
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      this.props.searchPlace(place, map);
    });
  }

  render() {
    return (
      <div id="search_area">
        <input
          type="text"
          ref="autocomplete"
        />
      </div>
    );
  }
}

export default Autocomplete;
