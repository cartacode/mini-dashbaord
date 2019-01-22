import React from "react";
import DashboardDataCard from "../components/DashboardDataCard";
import apiProxy from "../api/apiProxy";
import PropTypes from "prop-types";
import { checkForAggressiveRefreshInterval } from "../utilities/checkForAggressiveRefreshInterval";

// Create a class component
class WidgetSNCurrentUsers extends React.Component {
    constructor(props) {
        super(props);

        this.state = { widgetName: "WidgetSNCurrentUsers", count: [], instance: props.instance };
    }

    componentDidMount = async () => {
        const response = await apiProxy.get(`/sn/${this.state.instance}/api/now/stats/sys_user_presence`, {
            params: {
                // Units: years, months, days, hours, minutes
                sysparm_query: "sys_updated_on>=javascript:gs.minutesAgoStart(5)",
                sysparm_count: "true",
                sysparm_display_value: "true"
            }
        });
        // console.log(response);
        this.setState({ count: response.data.result.stats.count });
    };

    renderCardBody() {
        return (
            <div className="item">
                <div className="single-num-title">Current Users (5 mins)</div>
                <div className="single-num-value">{this.state.count}</div>
            </div>
        );
    }

    render() {
        return (
            <DashboardDataCard id={this.props.id} position={this.props.position} color={this.props.color} widgetName="WidgetSNCurrentUsers">
                {this.renderCardBody()}
            </DashboardDataCard>
        );
    }
}

// Force the caller to include the proper attributes
WidgetSNCurrentUsers.propTypes = {
    instance: PropTypes.string.isRequired
};

// Set default props in case they aren't passed to us by the caller
WidgetSNCurrentUsers.defaultProps = {
    interval: 60
};

export default WidgetSNCurrentUsers;
