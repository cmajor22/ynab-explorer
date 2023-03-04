import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import * as d3 from 'd3';
import { sankey } from 'd3-sankey';
import SankeyChart from './Sankey';
import _ from 'lodash';

const ynab = require("ynab");
const accessToken = "FAdGiTXXLgc4TnRrMuTidtwNzDiBuXnF6-f_8yJwOsA";
const ynabAPI = new ynab.API(accessToken);


function App() {
	const [budgets, setBudgets] = useState([]);
	const [selectedBudget, setSelectedBudget] = useState('');
	// const [months, setMonths] = useState('');
	const [baseTransactions, setBaseTransactions] = useState([]);
	const [transactions, setTransactions] = useState([]);
	const [depositsData, setDepositsData] = useState(null);
	const [years, setYears] = useState([]);
	const [reportType, setReportType] = useState('All');
	const [reportMonth, setReportMonth] = useState('All');
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "All"];

	const handleReportType = (event, newReportType) => {
		setReportType(newReportType);
	}
	
	useEffect(() => {
		ynabAPI.budgets.getBudgets()
		.then(response => {
			setBudgets(response.data.budgets);
		});
		// ynabAPI.months.getBudgetMonths("bee2ca8b-ea67-4c8e-a45f-450d55947917")
		// .then(response => {
		// 	setMonths(response.data);
		// })
	}, []);

	useEffect(()=>{
		if(budgets.length===1) {
			setSelectedBudget(budgets[0].id)
		}
	}, [budgets])

	useEffect(() => {
		ynabAPI.transactions.getTransactions(selectedBudget)
		.then(response => {
			setBaseTransactions(response.data.transactions);
			setTransactions(response.data.transactions);
			setYears(_.uniqBy(response.data.transactions, t => {return t.date.substring(0,4)}).map((y) => y.date));
		})
	}, [selectedBudget]);

	useEffect(() => {
		const grouped = _.groupBy(transactions, t => { return t.amount < 0 ? 'withdrawls' : 'deposits'});
		let depositGroups = _.groupBy(grouped.deposits, 'payee_name');
		delete depositGroups['Manual Balance Adjustment'];
		delete depositGroups['Starting Balance'];
		delete depositGroups['Transfer : RBC - Chequing'];
		let totalDeposits = 0;
		_.forOwn(depositGroups, (element, name) => {
			totalDeposits+=_.sumBy(element, 'amount');;
		});
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
				"value": Number(element.total/1000),
				"percentage": Number((element.total/totalDeposits)*100).toFixed(2)
			})
		});
		dn.push({
			"node": dn.length,
			"name": 'Total Deposits',
			"color": "#00FF00"
		})
		setDepositsData({"nodes": dn, "links": dl});
	}, [transactions])

	useEffect(() => {
		if(reportType==="All"){
			setTransactions(baseTransactions);
		}else{
			if(reportMonth==="All") {
				console.log(baseTransactions)
			}else{

			}
		}
	}, [reportType, reportMonth]);


	
	return (
		<div className="App">
			<header className="App-header">
				{/* {console.log(transactions)} */}
				{/* <SankeyChart data={testData} style={{width: '100vh', height: '100vh'}}/> */}

				<FormControl>
					<InputLabel id="budget-label">Budget</InputLabel>
					<Select
						labelId="budget-label"
						id="budget-select"
						value={selectedBudget}
						label="Budget"
						onChange={(e) => {setSelectedBudget(e.target.value)}}
						style={{width: '300px'}}
					>
						{budgets.map((budget) => {
							return <MenuItem value={budget.id}>{budget.name}</MenuItem>
						})}
					</Select>
				</FormControl>
				<ToggleButtonGroup
					value={reportType}
					exclusive
					onChange={handleReportType}
					>
					{years.map((year) => {
						return <ToggleButton value={year.substring(0,4)}><Typography>{year.substring(0,4)}</Typography></ToggleButton>
					})}
					<ToggleButton value="All"><Typography>All</Typography></ToggleButton>
					<ToggleButton value="Custom"><Typography>Custom</Typography></ToggleButton>
				</ToggleButtonGroup>
				{reportType !== 'All' && reportType !== 'Custom' && <ToggleButtonGroup
					value={reportMonth}
					exclusive
					onChange={(e) => {setReportMonth(e.target.value)}}
					>
					{months.map((month) => {
						return <ToggleButton value={month}><Typography>{month}</Typography></ToggleButton>
					})}
				</ToggleButtonGroup>}
				{depositsData && <SankeyChart data={depositsData} style={{width: '100vh', height: '100vh'}}/> }
			</header>
		</div>
  );
}

export default App;
