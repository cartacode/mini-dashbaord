import React from "react";
import DashboardCard from "./DashboardCard";
import apiProxy from "../api/apiProxy";
import PropTypes from "prop-types";
import { determineOSAndBrowserExternal } from "./user_authAnalyze";

// Create a class component
class WidgetSNClicksByOS extends React.Component {
  constructor(props) {
    super(props);
    this.state = { widgetName: "firstwidget", count: [], instance: props.instance, OSDict: {}, browserDict: {} };
  }

  componentDidMount = async () => {
    let groupby_field = "user_agent";
    const response = await apiProxy.get(`/sn/${this.state.instance}/api/now/stats/syslog_transaction`, {
      params: {
        // Units: years, months, days, hours, minutes
        sysparm_query: "client_transaction=true^sys_created_on>=javascript:gs.daysAgoStart(7)",
        sysparm_count: "true",
        sysparm_display_value: "true",
        sysparm_group_by: groupby_field
      }
    });

    // Restructure the ServiceNow response into an array of user_agent strings
    let user_agent_strings = response.data.result.map(element => {
      return {
        [groupby_field]: element["groupby_fields"][0]["value"] || "<blank>",
        count: element.stats.count
      };
    });

    // Create a dictionary of counts for both browswer and OS
    let [OSDict, browserDict] = this.analyzeBrowserResults(user_agent_strings);

    // Save into our component state
    this.setState({ OSDict: OSDict, browserDict: browserDict });
  };

  renderTable() {
    if (this.state.OSDict === {}) {
      return <div className="single-num-value">No Clicks Today :(</div>;
    } else {
      return (
        <div style={{ fontSize: "1.6vw" }}>
          <table>
            <tbody>
              {Object.keys(this.state.OSDict).map(key => (
                <tr key={this.state.OSDict[key]["name"]}>
                  <td>{this.state.OSDict[key]["name"]}</td>
                  <td>{this.state.OSDict[key]["pct"].toFixed(1)}%</td>
                  <td>{this.state.OSDict[key]["count"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <tbody>
              {Object.keys(this.state.browserDict).map(key => (
                <tr key={this.state.browserDict[key]["name"]}>
                  <td>{this.state.browserDict[key]["name"]}</td>
                  <td>{this.state.browserDict[key]["pct"].toFixed(1)}%</td>
                  <td>{this.state.browserDict[key]["count"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  renderCardHeader() {
    return <div className="single-num-title">Clicks By OS (Today)</div>;
  }

  renderCardBody() {
    return <div className="item">{this.renderTable()}</div>;
  }

  render() {
    return (
      <DashboardCard id={this.props.id} position={this.props.position} color={this.props.color} widgetName="WidgetSNClicksByOS">
        {this.renderCardHeader()}
        {this.renderCardBody()}
      </DashboardCard>
    );
  }

  // ########################################################################################
  // ########################################################################################
  // ########################################################################################

  analyzeBrowserResults(user_agent_table) {
    // Print out all user_agent strings for trouble-shooting
    console.log("All user_agent strings:");
    user_agent_table.forEach(row => {
      console.log(`${row.count}: ${row.user_agent}`);
    });

    let browserDict = {};
    let OSDict = {};

    user_agent_table.forEach(element => {
      // this function is an external module which we import, see top of file
      let [browserName, osName] = determineOSAndBrowserExternal(element["user_agent"]);

      // Accumulate a count of each OS
      OSDict[osName] = (osName in OSDict ? OSDict[osName] : 0) + parseInt(element["count"]);
      // Accumulate a count of each browser
      browserDict[browserName] = (browserName in browserDict ? browserDict[browserName] : 0) + parseInt(element["count"]);
    });

    // Get total of all browser counts
    let browserTotal = Object.values(browserDict).reduce((total, num) => {
      return total + num;
    });

    // Get total of all OS counts
    let OSTotal = Object.values(browserDict).reduce((total, num) => {
      return total + num;
    });

    // Construct Browser object with percentages
    for (const key of Object.keys(browserDict)) {
      browserDict[key] = {
        count: browserDict[key],
        pct: (browserDict[key] / browserTotal) * 100,
        name: key
      };
    }

    // Construct OS object with percentages
    for (const key of Object.keys(OSDict)) {
      OSDict[key] = {
        count: OSDict[key],
        pct: (OSDict[key] / OSTotal) * 100,
        name: key
      };
    }

    return [OSDict, browserDict];
  }

  // end of class
}

// Force the caller to include the proper attributes
WidgetSNClicksByOS.propTypes = {
  instance: PropTypes.string.isRequired
};

export default WidgetSNClicksByOS;