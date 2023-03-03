import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import * as d3 from 'd3';
import { sankey } from 'd3-sankey';
import SankeyChart from './Sankey';
import _ from 'lodash';

const ynab = require("ynab");
const accessToken = "yMspI9EDYV4fS8pn8AYrIGmWs40JExkbWlxxDsY95xY";
const ynabAPI = new ynab.API(accessToken);


function App() {
	const [budgets, setBudgets] = useState('');
	const [months, setMonths] = useState('');
	const [transactions, setTransactions] = useState('');
	const [depositsData, setDepositsData] = useState(null);

	
	useEffect(() => {
		// ynabAPI.budgets.getBudgets()
		// .then(response => {
		// 	setBudgets(response.data.budgets);
		// });
		// ynabAPI.months.getBudgetMonths("bee2ca8b-ea67-4c8e-a45f-450d55947917")
		// .then(response => {
		// 	setMonths(response.data);
		// })
		ynabAPI.transactions.getTransactions("bee2ca8b-ea67-4c8e-a45f-450d55947917")
		.then(response => {
			setTransactions(response.data);
			const grouped = _.groupBy(response.data.transactions, t => { return t.amount < 0 ? 'withdrawls' : 'deposits'});
			const totalDeposits = _.sumBy(grouped.deposits, 'amount');
			let depositGroups = _.groupBy(grouped.deposits, 'payee_name');
			console.log(depositGroups);
			delete depositGroups['Manual Balance Adjustment'];
			console.log(Object.keys(depositGroups).length);
			let dn = [];
			let dl = [];
			_.forOwn(depositGroups, (element, name) => {
				element.total = _.sumBy(element, 'amount');
				dn.push({
					"node": dn.length,
					"name": name,
					"color": "#00FF00"
				});
				dl.push({
					"source": dn.length-1,
					"target": Object.keys(depositGroups).length,
					"value": element.total
				})
			});
			dn.push({
				"node": dn.length,
				"name": 'Total Deposits',
				"color": "#00FF00"
			})
			console.log(dn, dl)
			setDepositsData({"nodes": dn, "links": dl});
		})
	}, []);
		
	
	
	return (
		<div className="App">
			<header className="App-header">
				{console.log(transactions)}
				{/* <SankeyChart data={testData} style={{width: '100vh', height: '100vh'}}/> */}
				{depositsData && <SankeyChart data={depositsData} style={{width: '100vh', height: '100vh'}}/> }
			</header>
		</div>
  );
}

export default App;
