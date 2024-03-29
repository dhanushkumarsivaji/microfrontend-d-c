import './MuiClassNameSetup';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from "react-redux";
import { createMemoryHistory, createBrowserHistory } from 'history';
import App from './App';
import store from "./store";


// Mount function to start up the app
const mount = (el, { onNavigate, defaultHistory, initialPath, token, acquireToken }) => {

  const root = ReactDOM.createRoot(el)

  const history =
    defaultHistory ||
    createMemoryHistory({
      initialEntries: [initialPath],
    });

  if (onNavigate) {
    history.listen(onNavigate);
  }

  root.render(<Provider store={store}><App history={history} token={token} acquireToken={acquireToken}/></Provider>);

  return {
    onParentNavigate({ pathname: nextPathname }) {
      const { pathname } = history.location;

      if (pathname !== nextPathname) {
        history.push(nextPathname);
      }
    },
  };
};

// If we are in development and in isolation,
// call mount immediately
if (process.env.NODE_ENV === 'development') {
  const devRoot = document.querySelector('#_accounts-dev-root');

  if (devRoot) {
    mount(devRoot, { defaultHistory: createBrowserHistory() });
  }
}

// We are running through container
// and we should export the mount function
export { mount };
