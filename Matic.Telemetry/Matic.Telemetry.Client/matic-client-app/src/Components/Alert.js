import React, { Component } from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import { SnackbarContent } from '@material-ui/core';

class Alert extends Component{
    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
      }

    open(){
        this.setState({open: true});
    }

    render(){
        const handleClose = (event, reason) => {
          if (reason === 'clickaway') {
            return;
          }
      
          this.setState({open: false});
        };
      
        return (
          <div>
            <Snackbar
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              open={this.state.open}
              autoHideDuration={3000}
              onClose={handleClose}
              action={
                <React.Fragment>
                  <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                  </IconButton>
                </React.Fragment>
              }
            >
                <SnackbarContent style={{backgroundColor: "#007E33", color: "white"}} message={"Copied to clipboard successfully!"}>

                </SnackbarContent>
                </Snackbar>
          </div>
        );
    }
}

export default Alert