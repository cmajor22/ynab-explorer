import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import * as d3 from 'd3';
import { sankey } from 'd3-sankey';
import SankeyChart from './Sankey';
import _ from 'lodash';
import moment from 'moment/moment';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const classes = {
	app: {
		backgroundColor: '#282c34',
		minHeight: '100vh',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 'calc(10px + 2vmin)',
		color: 'white',
		paddingTop: '20px',
		minWidth: '600px',
		maxWidth: '100vw',
		paddingLeft: '10vw',
		paddingRight: '10vw'
	}
}

const ynab = require("ynab");
const accessToken = "GntwW-Ma2SzGrk1bNs58aSZccTOXj8M1-M0KxQcmRRM";
const ynabAPI = new ynab.API(accessToken);

function App() {
	const [budgets, setBudgets] = useState([]);
	const [selectedBudget, setSelectedBudget] = useState('');
	const [baseTransactions, setBaseTransactions] = useState([]);
	const [transactions, setTransactions] = useState([]);
	const [depositsData, setDepositsData] = useState(null);
	const [withdrawlsData, setWithdrawlsData] = useState(null);
	const [years, setYears] = useState([]);
	const [reportType, setReportType] = useState('All');
	const [reportMonth, setReportMonth] = useState('All');
	const [months, setMonths] = useState(['All']);

	const handleReportType = (event, newReportType) => {
		if(newReportType===null) {
			return;
		}
		setReportType(newReportType);
		setReportMonth("All");
	}
	
	const handleReportMonth = (event, newReportMonth) => {
		if(newReportMonth===null) {
			return;
		}
		setReportMonth(newReportMonth);
	}

	useEffect(() => {
		ynabAPI.budgets.getBudgets()
		.then(response => {
			setBudgets(response.data.budgets);
		});
	}, []);

	useEffect(()=>{
		if(budgets.length===1) {
			setSelectedBudget(budgets[0].id);
		}
	}, [budgets])

	useEffect(() => {
		ynabAPI.transactions.getTransactions(selectedBudget)
		.then(response => {
			setBaseTransactions(response.data.transactions);
			setTransactions(JSON.parse(JSON.stringify(response.data.transactions)));
			setYears(_.uniqBy(response.data.transactions, t => {return t.date.substring(0,4)}).map((y) => y.date));
		})
	}, [selectedBudget]);

	useEffect(() => {
		const grouped = _.groupBy(transactions, t => { return t.amount < 0 ? 'withdrawls' : 'deposits'});

		// Setting up deposits data
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

		// Setting up Withdrawl Data
		let withdrawlGroups = _.groupBy(grouped.withdrawls, 'payee_name');
		delete withdrawlGroups['Manual Balance Adjustment'];
		delete withdrawlGroups['Starting Balance'];
		delete withdrawlGroups['Transfer : RBC - Chequing'];
		let totalWithdrawls = 0;
		_.forOwn(withdrawlGroups, (element, name) => {
			totalWithdrawls+=_.sumBy(element, 'amount');;
		});
		let wn = [];
		let wl = [];
		wn.push({
			"node": 0,
			"name": 'Total Expenses',
			"color": "#FF0000"
		})
		_.forOwn(withdrawlGroups, (element, name) => {
			element.total = _.sumBy(element, 'amount');
			wn.push({
				"node": wn.length,
				"name": name,
				"color": "#FF0000"
			});
			wl.push({
				"source": 0,
				"target": wn.length-1,
				"value": Number(element.total/1000),
				"percentage": Number((element.total/totalWithdrawls)*100).toFixed(2)
			})
		});
		setWithdrawlsData({"nodes": wn, "links": wl});

	}, [transactions])

	useEffect(() => {
		if(reportType==="All"){
			setTransactions(JSON.parse(JSON.stringify(baseTransactions)));
		}else{
			let m = _.uniqBy(_.filter(baseTransactions, t => { return t.date.substring(0,4)===reportType}), t => {
				return moment(t.date).format('MMMM');
			}).map((m) => {
				return moment(m.date).format('MMMM');
			});
			m.push("All");
			setMonths(m);
			if(reportMonth==="All") {
				setTransactions(_.filter(baseTransactions, t => { return t.date.substring(0,4)===reportType}));
			}else{
				setTransactions(_.filter(baseTransactions, t => {
					return moment(t.date).format('YYYY')===reportType && moment(t.date).format('MMMM')===reportMonth;
				}));
			}
		}
	}, [reportType, reportMonth]);
	
	return (
		<ThemeProvider theme={darkTheme}>
			<CssBaseline />
			<Box style={classes.app}>
				<Grid container>
					<Grid item xs={3}>
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
					</Grid>
					<Grid item xs={9} display='flex' justifyContent='flex-end'>
						<ToggleButtonGroup
							value={reportType}
							exclusive
							onChange={handleReportType}
							>
							{years.map((year) => {
								return <ToggleButton key={year.substring(0,4)} value={year.substring(0,4)}><Typography>{year.substring(0,4)}</Typography></ToggleButton>
							})}
							<ToggleButton value="All"><Typography>All</Typography></ToggleButton>
						</ToggleButtonGroup>
					</Grid>
					<Grid item xs={12} display='flex' justifyContent='flex-end'>
						{reportType !== 'All' && reportType !== 'Custom' && <ToggleButtonGroup
							value={reportMonth}
							exclusive
							onChange={handleReportMonth}
							>
							{months.map((month) => {
								return <ToggleButton key={month} value={month}><Typography>{month.substring(0,3)}</Typography></ToggleButton>
							})}
						</ToggleButtonGroup>}
					</Grid>
				</Grid>
				{depositsData?.nodes?.length>0 && <SankeyChart data={depositsData}/> }
				{withdrawlsData?.nodes?.length>0 && <SankeyChart data={withdrawlsData} style={{width: '100%', height: '100%'}}/> }
			</Box>
		</ThemeProvider>
  );
}

export default App;
