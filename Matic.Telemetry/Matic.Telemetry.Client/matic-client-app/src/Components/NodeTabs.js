import React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import NodeTable from './NodeTable';
import NodeMetadata from './NodeMetadata';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Badge from '@material-ui/core/Badge';
import NodeBadge from './NodeBadge';
import Map from './Map';

class NodeTabs extends React.Component {
  constructor(props) {
    super(props);
    // Set the state
    this.state = {value: 0};
  };

  TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`scrollable-auto-tabpanel-${index}`}
        aria-labelledby={`scrollable-auto-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box p={3} style={{ padding: 0 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }y

  a11yProps(index) {
    return {
      id: `scrollable-auto-tab-${index}`,
      'aria-controls': `scrollable-auto-tabpanel-${index}`,
    };
  }

  handleChange = (event, newValue) => {
    this.setState({value: newValue});
  };

  render() {
    const tabsStyle = {
      width: "100%",
      paddingLeft: 0,
      paddingRight: 0,
      backgroundColor: "#383838",
      position: "relative"
    };

    const tabStyle = {
      backgroundColor: "#383838",
      position: "relative",
    };

    const tabPanelStyle = {
      position: "relative",
    };

    const labelSpanStyle = { marginRight: "8px" };

    var label1 = <NodeBadge server={this.props.server} category="+" label="All" />;
    var label2 = <NodeBadge server={this.props.server} category="Bor Service" label="Bor" />;
    var label3 = <NodeBadge server={this.props.server} category="Heimdall Service" label="Heimdall Service" />;
    var label4 = <NodeBadge server={this.props.server} category="Heimdall Bridge" label="Heimdall Bridge" />;
    var label5 = <NodeBadge server={this.props.server} category="REST Server" label="REST" />;
    const label6 = <Badge color="primary" badgeContent={0}><span style={labelSpanStyle}>Map</span></Badge>;

    return (
      <div>
      <Tabs style={tabsStyle}
        value={this.state.value}
        onChange={this.handleChange}
        indicatorColor="primary"
        TabIndicatorProps={{
          style: {
            height: "4px",
          }
        }}
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        aria-label="scrollable auto tabs example"
      >
        <Tab style={tabStyle} label={label1} {...this.a11yProps(0)} />
        <Tab style={tabStyle} label={label2} {...this.a11yProps(1)} />
        <Tab style={tabStyle} label={label3} {...this.a11yProps(2)} />
        <Tab style={tabStyle} label={label4} {...this.a11yProps(3)} />
        <Tab style={tabStyle} label={label5} {...this.a11yProps(4)} />
        <Tab style={tabStyle} label={label6} {...this.a11yProps(5)} />
      </Tabs>
      <this.TabPanel value={this.state.value} index={0} style={tabPanelStyle}>
        <NodeMetadata server={this.props.server} category="+"></NodeMetadata>
        <NodeTable server={this.props.server} category="+"></NodeTable>
      </this.TabPanel>
      <this.TabPanel value={this.state.value} index={1} style={tabPanelStyle}>
        <NodeMetadata server={this.props.server} category="Bor Service"></NodeMetadata>
        <NodeTable server={this.props.server} category="Bor Service"></NodeTable>
      </this.TabPanel>
      <this.TabPanel value={this.state.value} index={2} style={tabPanelStyle}>
        <NodeMetadata server={this.props.server} category="Heimdall Service"></NodeMetadata>
        <NodeTable server={this.props.server} category="Heimdall Service"></NodeTable>
      </this.TabPanel>
      <this.TabPanel value={this.state.value} index={3} style={tabPanelStyle}>
        <NodeMetadata server={this.props.server} category="Heimdall Bridge"></NodeMetadata>
        <NodeTable server={this.props.server} category="Heimdall Bridge"></NodeTable>
      </this.TabPanel>
      <this.TabPanel value={this.state.value} index={4} style={tabPanelStyle}>
        <NodeMetadata server={this.props.server} category="REST Server"></NodeMetadata>
        <NodeTable server={this.props.server} category="REST Server"></NodeTable>
      </this.TabPanel>
      <this.TabPanel value={this.state.value} index={5} style={tabPanelStyle}>
        <Map server={this.props.server} />
      </this.TabPanel>
    </div>
    );
  }
}

export default NodeTabs;