import { createRoot, createSignal, onCleanup } from "solid-js";
import Home from "./components/Home";

function createRouteHandler() {
  const [location, setLocation] = createSignal("home"),
    locationHandler = e => setLocation(window.location.hash.slice(1));
  window.addEventListener("hashchange", locationHandler);
  onCleanup(() => window.removeEventListener("hashchange", locationHandler));
  return match => match === location();
}

const Profile = () => (
  <>
    <h1>Your Profile</h1>
    <p>This section could be about you.</p>
  </>
);

const Settings = () => (
  <>
    <h1>Settings</h1>
    <p>All that configuration you never really ever want to look at.</p>
  </>
);

const App = () => {
  const matches = createRouteHandler();
  return (
    <>
      <ul>
        <li>
          <a href="#home">Home</a>
        </li>
        <li>
          <a href="#profile">Profile</a>
        </li>
        <li>
          <a href="#settings">Settings</a>
        </li>
      </ul>
      <$ when={matches("home")}>
        <Home />
      </$>
      <$ when={matches("profile")}>
        <Profile />
      </$>
      <$ when={matches("settings")}>
        <Settings />
      </$>
    </>
  );
};

createRoot(() => document.body.appendChild(<App />));
