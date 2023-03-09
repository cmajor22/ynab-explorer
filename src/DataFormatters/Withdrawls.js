import _ from "lodash";

function Withdrawls(transactions) {
    let nodes = [], links = [];

    // Setting up Withdrawl Data (No Groupings)
    let withdrawlGroups = _.groupBy(transactions.withdrawls, 'category_name');
    delete withdrawlGroups['Uncategorized'];

    // Sum totals so we can display % later
    let totalWithdrawls = 0;
    _.forOwn(withdrawlGroups, (element, name) => {
        totalWithdrawls+=_.sumBy(element, 'amount');;
    });

    // Create Nodes and Links
    nodes.push({
        "node": 0,
        "name": 'Total Expenses',
        "color": "#FF0000"
    })
    _.forOwn(withdrawlGroups, (element, name) => {
        element.total = _.sumBy(element, 'amount');
        nodes.push({
            "node": nodes.length,
            "name": name,
            "color": "#FF0000"
        });
        links.push({
            "source": 0,
            "target": nodes.length-1,
            "value": Number(element.total/1000*-1),
            "percentage": Number((element.total*-1/totalWithdrawls*-1)*100).toFixed(2),
            "titleFrom": 'target'
        })
    });

    return {nodes, links};
}

export default Withdrawls;