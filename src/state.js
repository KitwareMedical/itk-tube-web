import React from 'react';
import PropTypes from 'prop-types';

function partial(func, ...args) {
  return (...moreArgs) => {
    func(...args, ...moreArgs);
  };
}

export default function connect(Component, storeNames, mapStoreToProps, mapActionsToProps) {
  let names = storeNames || [];
  if (typeof names === 'string') {
    names = [names];
  }

  const storeMapper = mapStoreToProps || (() => ({}));
  const actionMapper = mapActionsToProps || (() => ({}));

  class ConnectedComponent extends React.Component {
    constructor(props) {
      super(props);

      const { stores } = props;
      if (!stores) {
        throw new Error('This component requires a "stores" prop!');
      }

      this.stores = stores;

      // TODO make errors in the mappers less nebulous
      this.state = storeMapper(stores, props);
      this.actions = actionMapper(props);

      this.onStoreChanged = this.onStoreChanged.bind(this);
      this.dispatch = this.dispatch.bind(this);
    }

    componentDidMount() {
      names.forEach(name =>
          this.stores[name].addChangeListener(partial(this.onStoreChanged, name)));
    }

    componentWillUnmount() {
      names.forEach(name =>
          this.stores[name].removeChangeListener(partial(this.onStoreChanged, name)));
    }

    onStoreChanged(storeName) {
      const subset = {};
      names.forEach((name) => { subset[name] = this.stores[name]; });
      this.setState(storeMapper(subset, this.props, storeName));
    }

    dispatch(action, ...args) {
      action(this.stores, ...args);
    }

    render() {
      return <Component dispatch={this.dispatch} {...this.state} actions={this.actions} {...this.props} />;
    }
  }

  ConnectedComponent.propTypes = {
    stores: PropTypes.object.isRequired,
  };

  return ConnectedComponent;
}
