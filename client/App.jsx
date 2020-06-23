import React, { useContext } from 'react';

import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import ProtectedRoute from './util/ProtectedRoute.jsx';

import { SessionContext } from './contexts/Session.jsx';

import Portal from './routes/Portal.jsx';
import Officials from './routes/Officials.jsx';
import Elections from './routes/Elections.jsx';

const App = () => {
  const { session } = useContext(SessionContext);

  const validate = () => {
    if (!session.address) {
      return '/';
    }
  };

  return (
    <Router>
      <Switch>
        <Route exact path='/'>
          <Portal />
        </Route>
        <ProtectedRoute path='/officials' validate={validate}>
          <Officials />
        </ProtectedRoute>
        <ProtectedRoute path='/elections' validate={validate}>
          <Elections />
        </ProtectedRoute>
        <Route>
          <h1>404 Not Found</h1>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;