import React, {useState} from 'react';
import ReactMarkdown from 'react-markdown'


export class Logger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      logMessage: ''
    };
  }

  componentDidMount() {
    console.log = (message) => {
      this.setState((prevState) => ({
        logMessage: prevState.logMessage + message
      }));
    };
  }

  render() {
    return (
      <ReactMarkdown linkTarget={"_blank"}>{this.state.logMessage}</ReactMarkdown>
    );
  }
}

