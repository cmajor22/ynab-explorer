import _ from "lodash";

function GroupedWithdrawls(categories, transactions) {
    // Setting up Withdrawl Data (with groupings)
    let withdrawlGroups = _.groupBy(transactions.withdrawls, 'category_name');
    delete withdrawlGroups['Uncategorized'];

    // Sum totals so we can calculate % later
    let totalWithdrawls = 0;
    _.forOwn(withdrawlGroups, (element, name) => {
        totalWithdrawls+=_.sumBy(element, 'amount');;
    });

    // Set up base nodes
    let baseNodes = [], baseLinks = [];
    _.forOwn(withdrawlGroups, (element, name) => {
        element.total = _.sumBy(element, 'amount');
        baseNodes.push({
            "name": name,
            "categoryId": element[0].category_id,
            "parent_id": null,
            "parent_name": null,
            "amount": element.total,
            "color": "#FF0000"
        });
        baseLinks.push({
            "source": 0,
            "target": baseNodes.length-1,
            "value": Number(element.total/1000*-1),
            "percentage": Number((element.total*-1/totalWithdrawls*-1)*100).toFixed(2),
            "titleFrom": 'target'
        })
    });

    // Assign parent categories for each transaction
    _.forEach(baseNodes, (element) => {
        _.forOwn(categories, (cs, n) => {
            _.forEach(cs.categories, (c) => {
                if(c.id===element.categoryId) {
                    element.parent_id=cs.id;
                    element.parent_name=cs.name;
                }
            })
        });
    });
    
    // Create nodes for display
    let groupedNodes = _.groupBy(_.sortBy(baseNodes, ['parent_name']), 'parent_name');
    let nodes = [], links = [];
    nodes.push({
        "node": 0,
        "name": 'Total Expenses',
        "color": "#FF0000"
    })
    // Iterate through groups
    _.forOwn(groupedNodes, (group, i) => {
        group.total = _.sumBy(group, 'amount');
        nodes.push({
            "node": nodes.length,
            "name": i,
            "color": "#FF0000"
        });
        let parentNode = nodes.length-1;
        links.push({
            "source": 0,
            "target": parentNode,
            "value": Number(group.total/1000*-1),
            "percentage": Number((group.total*-1/totalWithdrawls*-1)*100).toFixed(2),
            "titleFrom": 'target'
        })
        // For each group, create sub categories
        _.forEach(group, (transaction) => {
            nodes.push({
                "node": nodes.length,
                "name": transaction.name,
                "color": "#FF0000"
            });
            links.push({
                "source": parentNode,
                "target": nodes.length-1,
                "value": Number(transaction.amount/1000*-1),
                "percentage": Number((transaction.amount*-1/totalWithdrawls*-1)*100).toFixed(2),
                "titleFrom": 'target'
            })
        })
    })

    return {nodes, links};
}

export default GroupedWithdrawls;