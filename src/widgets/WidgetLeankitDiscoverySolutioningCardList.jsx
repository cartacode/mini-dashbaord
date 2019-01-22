import React from "react";
import DashboardDataCard from "../components/DashboardDataCard";
import { getLeankitCards } from "../utilities/getLeankitCards";
import { getCommentsforLeankitCards } from "../utilities/getCommentsForLeankitCards";
import { getBacklogDurationForLeankitCards } from "../utilities/getBacklogDurationForLeankitCards";
import { checkForAggressiveRefreshInterval } from "../utilities/checkForAggressiveRefreshInterval";

var moment = require("moment");

var classNames = require("classnames");

// Create a class component
class WidgetLeankitDiscoverySolutioningCardList extends React.Component {
    constructor(props) {
        super(props);

        this.state = { instance: props.instance, leankit_cards: [], boardId: props.boardId };
    }

    componentDidMount = async () => {
        // Get all the leankit cards
        let leankit_cards = await getLeankitCards("jnj.leankit.com", this.state.boardId, "active,backlog");

        // Filter down to just solutioning cards
        let filteredCards = leankit_cards.filter(function(card) {
            return card.u_lanes[1].name === "Solutioning" && card.u_lanes[2].name === "Non-Project WUs";
        });

        // Put a dummy value in for backlogDuration, we'll figure it out later
        filteredCards.forEach(card => {
            card.backlogDuration = { days: "unknown" };
        });

        // Save these cards to our state, which triggers react to render an update to the screen
        this.setState({ leankit_cards: filteredCards });

        // Enrich each card by adding URL field (BoardID is hard-coded)
        for (var i = 0; i < filteredCards.length; i++) {
            var card = filteredCards[i];
            // card.url = sprintf("%s/%s/%s", "https://jnj.leankit.com/Boards/View", boardID, card["Id"]);
            card.url = `https://jnj.leankit.com/card/${card.id}`;
        }

        // User comments are not part of original call, so add them now
        let leankit_cards_with_comments = await getCommentsforLeankitCards(filteredCards, "jnj.leankit.com");

        // Save these cards to our state, which triggers react to render an update to the screen
        this.setState({ leankit_cards: leankit_cards_with_comments });

        // Get the backlog duration
        let leankit_cards_with_backlogDuration = await getBacklogDurationForLeankitCards(filteredCards, "jnj.leankit.com");
        // console.log(leankit_cards_with_backlogDuration);

        // Save these cards to our state, which triggers react to render an update to the screen
        this.setState({ leankit_cards: leankit_cards_with_backlogDuration });
    };

    renderTableBody() {
        return (
            <tbody>
                {this.state.leankit_cards
                    .sort((a, b) => {
                        return b.daysInLane - a.daysInLane;
                    })
                    .map(function(card, index) {
                        // Set some variables to be used in JSX below
                        let cardOwner =
                            (card.assignedUsers && card.assignedUsers.length > 0 && card.assignedUsers[0].fullName) || "No Owner";
                        let commentMostRecentText = "Waiting for Comment";
                        let commentMostRecentAuthor = "Waiting for Comment";
                        let commentMostRecent = { ageInDays: "Waiting for Comment" };
                        let inLane = { days: card.daysInLane };
                        inLane.className = inLane.days > 14 ? "redFont" : inLane.days > 11 ? "orangeFont" : "greenFont";

                        if (card.comments && card.comments.length > 0 && card.comments[0].text) {
                            commentMostRecentText = card.comments[0].text;
                            commentMostRecentAuthor = card.comments[0].createdBy.fullName;
                            commentMostRecent.ageInDays = moment().diff(moment(card.comments[0].createdOn), "days");
                            commentMostRecent.className =
                                commentMostRecent.ageInDays > 5 ? "redFont" : commentMostRecent.ageInDays > 3 ? "orangeFont" : "greenFont";
                        }

                        // Strip the html tags
                        let temporalDivElement = document.createElement("div");
                        // Set the HTML content with the providen
                        temporalDivElement.innerHTML = commentMostRecentText;
                        // Retrieve the text property of the element (cross-browser support)
                        let zeroHTML = temporalDivElement.textContent || temporalDivElement.innerText || "";
                        // Truncate the ext
                        commentMostRecentText = zeroHTML.substring(0, 200);

                        let backlogComplete = card.backlogComplete || card.createdOn;
                        let backlogDuration = moment(backlogComplete).diff(moment(card.createdOn), "days");

                        // Now return a JSX statement for rendering (remember, we're inside a .map() loop)
                        return (
                            <tr key={card["id"]}>
                                <td align="center">{index + 1}</td>
                                <td>{cardOwner}</td>
                                <td align="center" className={classNames(inLane.className)}>
                                    {inLane.days} days
                                </td>
                                <td>{backlogDuration} days</td>
                                <td>
                                    <a href={card.url}>{card["title"]}</a>
                                </td>
                                <td align="center" className={classNames(commentMostRecent.className)}>
                                    {commentMostRecent.ageInDays} days
                                </td>
                                <td>
                                    <b>(({commentMostRecentAuthor}))</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {commentMostRecentText}
                                </td>
                            </tr>
                        );
                    })}
            </tbody>
        );
    }

    renderTable() {
        if (this.state.leankit_cards.length === 0) {
            return <div className="waiting-for-data">Waiting for data...</div>;
        } else {
            return (
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th width="3%" />
                                <th width="13%">Owner</th>
                                <th width="7%">Days in Lane</th>
                                <th width="6%">Backlog</th>
                                <th width="35%">Description</th>
                                <th width="7%">Comment Age</th>
                                <th width="30%">Most Recent Comment</th>
                            </tr>
                        </thead>
                        {this.renderTableBody()}
                    </table>
                </div>
            );
        }
    }

    renderCardBody() {
        return <div className="item">{this.renderTable()}</div>;
    }

    render() {
        return (
            <DashboardDataCard
                id={this.props.id}
                position={this.props.position}
                color={this.props.color}
                widgetName="WidgetLeankitDiscoverySolutioningCardList"
            >
                <div className="single-num-title">Solutioning Cards (Non-Project)</div>
                {this.renderCardBody()}
            </DashboardDataCard>
        );
    }

    // end of class
}

// Set default props in case they aren't passed to us by the caller
WidgetLeankitDiscoverySolutioningCardList.defaultProps = {
    interval: 60
};

export default WidgetLeankitDiscoverySolutioningCardList;
