import _ from "lodash";

function Deposits(transactions) {
    // Setting up deposits data
    let depositGroups = _.groupBy(transactions.deposits, 'payee_name');
    delete depositGroups['Manual Balance Adjustment'];
    delete depositGroups['Starting Balance'];
    delete depositGroups['Transfer : RBC - Chequing'];

    // Sum totals so we can dispaly % later
    let totalDeposits = 0;
    _.forOwn(depositGroups, (element, name) => {
        totalDeposits+=_.sumBy(element, 'amount');;
    });

    // Set up nodes and links
    let nodes = [], links = [];
    _.forOwn(depositGroups, (element, name) => {
        element.total = _.sumBy(element, 'amount');
        nodes.push({
            "node": nodes.length,
            "name": name,
            "color": "#00FF00"
        });
        links.push({
            "source": nodes.length-1,
            "target": Object.keys(depositGroups).length,
            "value": Number(element.total/1000),
            "percentage": Number((element.total/totalDeposits)*100).toFixed(2),
            "titleFrom": 'source'
        })
    });
    nodes.push({
        "node": nodes.length,
        "name": 'Max In / Out',
        "color": "#00FF00"
    })

    return {nodes, links};
}

export default Deposits;