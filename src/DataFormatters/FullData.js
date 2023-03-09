import _ from "lodash";
import Deposits from "./Deposits";
import GroupedWithdrawls from "./GroupedWithdrawls";

function FullData(categories, grouped) {
    if(grouped.length===0) {
        return {"nodes": [], "links": []};
    }
    const deposits = Deposits(grouped);
    const withdrawls = GroupedWithdrawls(categories, grouped);

    let nodes = deposits.nodes, links = deposits.links;
    const totalDeposits = _.sumBy(deposits.links, 'value');
    const totalWithdrawls = Number(_.sumBy(withdrawls.links, 'value'))/2;

    if(totalDeposits>totalWithdrawls) {
        // Go to Savings
        nodes.push({
            "node": nodes.length,
            "name": 'Surplus',
            "color": '#0000FF',
        });
        links.push({
            "source": nodes.length-2,
            "target": nodes.length-1,
            "value": Number(totalDeposits-totalWithdrawls),
            "percentage": Number(((totalDeposits-totalWithdrawls)/totalDeposits)*100).toFixed(2)
        });
    }else if(totalWithdrawls>totalDeposits){
        // Go to Deficit
        nodes.push({
            "node": nodes.length,
            "name": 'Deficit',
            "color": '#FFA500',
        });
        links.push({
            "source": nodes.length-2,
            "target": nodes.length-1,
            "value": Number(totalWithdrawls-totalDeposits),
            "percentage": Number(((totalWithdrawls-totalDeposits)/totalDeposits)*100).toFixed(2)
        });
    }else{
        // Balanced
    }
    const nLength = nodes.length;
    if(links.length>0) {
        links.push({
            "source": nLength-2,
            "target": nLength,
            "value": totalWithdrawls,
            "percentage": Number((totalWithdrawls/totalDeposits)*100).toFixed(2)
        })
    }
    console.log('links')
    console.log(links)
    _.forEach(withdrawls.nodes, (w) => {
        w.node = nodes.length;
        console.log(w)
        nodes.push(w);
    })
    _.forEach(withdrawls.links, (w) => {
        w.source += nLength;
        w.target += nLength;
        links.push(w);
    })

    console.log(totalDeposits, totalWithdrawls)

    // _.forEach(withdrawls.nodes, (n) => {
    //     let newN = n;
    //     newN.node=nodes.length;
    //     nodes.push(n);
    // })

    console.log(nodes, links)
    return { nodes, links };
}

export default FullData;