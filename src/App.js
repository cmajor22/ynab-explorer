import './App.css';
import { useEffect, useState } from 'react';
import { Box, Divider, FormControl, Grid, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import SankeyChart from './Sankey';
import _ from 'lodash';
import moment from 'moment/moment';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Withdrawls from './DataFormatters/Withdrawls';
import GroupedWithdrawls from './DataFormatters/GroupedWithdrawls';
import Deposits from './DataFormatters/Deposits';

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
const accessToken = "02gk1ZhSoJsaPnIeaGmPrK4WUpCzgQfIzISP1TjpgaE";
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
	const [categories, setCategories] = useState([]);

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
		if(selectedBudget==='') {
			return;
		}
		ynabAPI.transactions.getTransactions(selectedBudget)
		.then(response => {
			let newTrans = [];
			response.data.transactions.forEach((t) => {
				if(t.subtransactions.length!==0) {
					t.subtransactions.forEach((s) => {
						let newT = JSON.parse(JSON.stringify(t));
						newT.category_name=s.category_name;
						newT.category_id=s.category_id;
						newT.amount=s.amount;
						newTrans.push(newT);
					});
				}
				newTrans.push(t);
			})
			newTrans = JSON.parse(JSON.stringify(newTrans));
			setBaseTransactions(newTrans);
			setTransactions(JSON.parse(JSON.stringify(newTrans)));
			setYears(_.uniqBy(newTrans, t => {return t.date.substring(0,4)}).map((y) => y.date));
		});
		ynabAPI.categories.getCategories(selectedBudget)
		.then(response => {
			setCategories(response.data.category_groups);
		})
	}, [selectedBudget]);

	useEffect(() => {
		const grouped = _.groupBy(transactions, t => { return t.amount < 0 ? 'withdrawls' : 'deposits'});

		const deposits = Deposits(grouped);
		setDepositsData(deposits);

		// const withdrawls = Withdrawls(grouped);
		// setWithdrawlsData(withdrawls);

		const groupedWithdrawls = GroupedWithdrawls(categories, grouped);
		setWithdrawlsData(groupedWithdrawls);

	}, [transactions, categories])

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
	}, [reportType, reportMonth, baseTransactions]);
	
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
									return <MenuItem key={budget.id} value={budget.id}>{budget.name}</MenuItem>
								})}
							</Select>
						</FormControl>
					</Grid>
					<Grid item xs={9} display='flex' justifyContent='flex-end'>
						{reportType !== 'All' && reportType !== 'Custom' && [<ToggleButtonGroup
							value={reportMonth}
							exclusive
							onChange={handleReportMonth}
							>
							{months.map((month) => {
								return <ToggleButton key={month} value={month}><Typography>{month.substring(0,3)}</Typography></ToggleButton>
							})}
						</ToggleButtonGroup>,
        				<Divider orientation="vertical" variant="middle" flexItem style={{marginLeft: '5px', marginRight: '5px'}} />]}
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
					<Grid item xs={12}>
						<br />
					</Grid>
					{/* Deposits */}
					<Grid item xs={0} lg={0}></Grid>
					<Grid item xs={12} lg={6}>
						{depositsData?.nodes?.length>0 && <SankeyChart data={depositsData} titleFrom={'source'}/> }
					</Grid>
					<Grid item xs={0} lg={0}></Grid>
					<br />
					{/* Expenses (With Groupings) */}
					<Grid item xs={0} lg={0}></Grid>
					<Grid item xs={12} lg={6}>
						{withdrawlsData?.nodes?.length>0 && <SankeyChart data={withdrawlsData} titleFrom={'destination'}/> }
					</Grid>
					<Grid item xs={0} lg={0}></Grid>
				</Grid>
			</Box>
		</ThemeProvider>
  );
}

export default App;
