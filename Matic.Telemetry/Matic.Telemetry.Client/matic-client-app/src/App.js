import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import NodeTabs from './Components/NodeTabs';

import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';

const titleStyle = {
  paddingLeft: "10px",
  fontSize: "x-large",
  fontWeight: "bolder",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
  userSelect: "none"
};

const githubStyle = {
  filter: "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(103deg) brightness(105%) contrast(105%)",
  display: "inline-block",
  height: "32px"
};

const theme = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#2891F9",
      paper: "#383838"
    },
    background: {
      main: "#121212",
    },
  },
});

const leftImageStyle = {
  borderStyle: "none",
  boxSizing: "content-box",
  maxWidth: "100%",
  position: "absolute",
  left: "0",
  bottom: "0",
  opacity: 0.2,
  pointerEvents: "none",
  zIndex: 1
};

const rightImageStyle = {
  borderStyle: "none",
  boxSizing: "content-box",
  maxWidth: "100%",
  position: "absolute",
  right: "0",
  top: "0",
  opacity: 0.2,
  pointerEvents: "none",
  zIndex: 1
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar style={{ backgroundColor: theme.palette.primary.paper}}>
          <a href="https://matic.network/" >
            <img src="logo256.png" alt="matic logo" height="64px" />
          </a>

          <span style={titleStyle}>
            Matic Telemetry
          </span>
          <div style={{ marginLeft: "auto", marginRight: 0 }}>
            <a href="https://github.com/sean-mcl/matic-telemetry">
              <img style={githubStyle} alt="github logo" src="github.svg" />
            </a>
          </div>

        </Toolbar>
      </AppBar>
      <NodeTabs server="ws://localhost/mqtt"/>
      <img src="background-mockup-left.svg" style={leftImageStyle}></img>
      <img src="background-mockup-right.svg" style={rightImageStyle}></img>
    </ThemeProvider>
  );
}

export default App;
