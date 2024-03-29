import React from "react";
import { Route, Redirect } from "react-router-dom";
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";

export const PrivateRoute = (props) => {
  const {
    component: Component,
    children: Children,
    token,
    acquireToken,
    isAuthenticated,
    ...restProps
  } = props;


  if (!Component) return null;

  return (
    <Route
      exact
      {...restProps}
      render={(routeRenderProps) => (
        <>
          <AuthenticatedTemplate>
              <Component {...routeRenderProps} token={token} acquireToken={acquireToken} isAuthenticated={isAuthenticated}/>
          </AuthenticatedTemplate>
          <UnauthenticatedTemplate>
            <Redirect
              to={{
                pathname: "/auth/signin",
                state: { from: routeRenderProps.location },
              }}
            />
          </UnauthenticatedTemplate>
        </>
      )}
    />
  );
};
