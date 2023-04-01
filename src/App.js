import './App.css';
import { useEffect, useState } from 'react';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup, Typography, FormGroup, FormControlLabel, Switch } from '@mui/material';
import SankeyChart from './Sankey';
import _ from 'lodash';
import moment from 'moment/moment';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GroupedWithdrawls from './DataFormatters/GroupedWithdrawls';
import Deposits from './DataFormatters/Deposits';
import FullData from './DataFormatters/FullData';

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
const clientId = 'Stnp__Fp_17fgQlqYmnk5n7NKCOvrz45YSEXqTxrbSE';
const redirect = 'https://ynabexplorer.com';
// const redirect = 'http://localhost:3000';
const auth = `https://api.youneedabudget.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect}&response_type=token&scope=read-only`;

function App() {
	const [budgets, setBudgets] = useState([]);
	const [selectedBudget, setSelectedBudget] = useState('');
	const [baseTransactions, setBaseTransactions] = useState([]);
	const [transactions, setTransactions] = useState([]);
	const [depositsData, setDepositsData] = useState(null);
	const [withdrawlsData, setWithdrawlsData] = useState(null);
	const [years, setYears] = useState([]);
	const [reportType, setReportType] = useState('All');
	const [reportYear, setReportYear] = useState('All');
	const [reportMonth, setReportMonth] = useState('All');
	const [months, setMonths] = useState(['All']);
	const [categories, setCategories] = useState([]);
	const [bothData, setBothData] = useState([]);
	const [bothVisible, setBothVisible] = useState(true);
	const [incomeVisible, setIncomeVisible] = useState(true);
	const [expensesVisible, setExpensesVisible] = useState(true);
	const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken')??'');
	const [ynabAPI, setYnabAPI] = useState(null);
	const [hideValues, setHideValues] = useState(true);


	const handleReportType = (event, newReportType) => {
		if(newReportType===null) {
			return;
		}
		setReportType(newReportType);
	}
	
	const handleReportYear = (event, newReportYear) => {
		if(newReportYear===null) {
			return;
		}
		setReportYear(newReportYear);
		setReportMonth("All");
	}
	
	const handleReportMonth = (event, newReportMonth) => {
		if(newReportMonth===null) {
			return;
		}
		setReportMonth(newReportMonth);
	}

	useEffect(() => {
		let params= {};

		window.location.hash.substring(1).split('&').forEach((p) => {
			params[p.split('=')[0]] = p.split('=')[1];
		});
		if(accessToken==='') {
			if(params.access_token===undefined){
				window.location = auth;
			}else{
				localStorage.setItem('accessToken', params.access_token);
				localStorage.setItem('refreshToken', params.refresh_token);
				setAccessToken(params.access_token);
			}
		}
	}, [accessToken]);

	useEffect(() => {
		if(accessToken!=='') {
			let y = new ynab.API(accessToken);
			setYnabAPI(y);
		}
	},[accessToken])

	useEffect(() => {
		if(ynabAPI===null) {
			return;
		}
		ynabAPI.budgets.getBudgets()
		.then(response => {
			setBudgets(response.data.budgets);
		})
		.catch(err => {
			if(err.error.id==='401') {
				localStorage.setItem('accessToken', '');
				localStorage.setItem('refreshToken', '');
				window.location = auth;
			}
		});
	}, [ynabAPI])

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
				}else{
					newTrans.push(t);
				}
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
	}, [selectedBudget, ynabAPI]);

	useEffect(() => {
		const grouped = _.groupBy(transactions, t => { return t.amount < 0 ? 'withdrawls' : 'deposits'});

		const deposits = Deposits(grouped);
		setDepositsData(deposits);

		const groupedWithdrawls = GroupedWithdrawls(categories, grouped);
		setWithdrawlsData(groupedWithdrawls);

		const fullData = FullData(categories, grouped);
		setBothData(fullData);

	}, [transactions, categories])

	useEffect(() => {
		if(reportYear==="All"){
			setTransactions(JSON.parse(JSON.stringify(baseTransactions)));
		}else{
			let m = _.uniqBy(_.filter(baseTransactions, t => { return t.date.substring(0,4)===reportYear}), t => {
				return moment(t.date).format('MMMM');
			}).map((m) => {
				return moment(m.date).format('MMMM');
			});
			m.push("All");
			setMonths(m);
			if(reportMonth==="All") {
				setTransactions(_.filter(baseTransactions, t => { return t.date.substring(0,4)===reportYear}));
			}else{
				setTransactions(_.filter(baseTransactions, t => {
					return moment(t.date).format('YYYY')===reportYear && moment(t.date).format('MMMM')===reportMonth;
				}));
			}
		}
	}, [reportYear, reportMonth, baseTransactions]);

	useEffect(() => {
		if(reportType==='All') {
			setBothVisible(true);
			setIncomeVisible(false);
			setExpensesVisible(false);
		}else if(reportType==='Income'){
			setBothVisible(false);
			setIncomeVisible(true);
			setExpensesVisible(false);
		}else if(reportType==='Expenses'){
			setBothVisible(false);
			setIncomeVisible(false);
			setExpensesVisible(true);
		}
	}, [reportType]);
	
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
					<Grid item xs={9} display='flex' justifyContent='flex-end' alignItems='center'>
						<FormGroup>
  							<FormControlLabel control={<Switch checked={hideValues} onChange={() => {setHideValues(!hideValues)}} />} label="Hide Values" />
						</FormGroup>
						<ToggleButtonGroup
							value={reportYear}
							exclusive
							onChange={handleReportYear}
							>
							{years.map((year) => {
								return <ToggleButton key={year.substring(0,4)} value={year.substring(0,4)}><Typography>{year.substring(0,4)}</Typography></ToggleButton>
							})}
							<ToggleButton value="All"><Typography>All</Typography></ToggleButton>
						</ToggleButtonGroup>
					</Grid>
					<Grid item xs={3}>
						<ToggleButtonGroup
							value={reportType}
							exclusive
							onChange={handleReportType}
							>
							<ToggleButton key={'Income'} value={'Income'}><Typography>Income</Typography></ToggleButton>
							<ToggleButton key={'Expenses'} value={'Expenses'}><Typography>Expenses</Typography></ToggleButton>
							<ToggleButton key={'All'} value={'All'}><Typography>All</Typography></ToggleButton>
						</ToggleButtonGroup>
					</Grid>
					<Grid item xs={9} display='flex' justifyContent='flex-end'>
						{reportYear !== 'All' && reportYear !== 'Custom' && <ToggleButtonGroup
							value={reportMonth}
							exclusive
							onChange={handleReportMonth}
							>
							{months.map((month) => {
								return <ToggleButton key={month} value={month}><Typography>{month.substring(0,3)}</Typography></ToggleButton>
							})}
						</ToggleButtonGroup>}
					</Grid>
					<Grid item xs={12}>
						<br />
					</Grid>
					{/* Deposits */}
					{ incomeVisible ? [
						<Grid item xs={0} lg={0}></Grid>,
						<Grid item xs={12} lg={12}>
							{depositsData?.nodes?.length>0 && <SankeyChart data={depositsData} hideValues={hideValues}/> }
						</Grid>,
						<Grid item xs={0} lg={0}></Grid>,
						<br />
					] : null }
					{/* Expenses (With Groupings) */}
					{ expensesVisible ? [
						<Grid item xs={0} lg={0}></Grid>,
						<Grid item xs={12} lg={12}>
							{withdrawlsData?.nodes?.length>0 && <SankeyChart data={withdrawlsData} hideValues={hideValues}/> }
						</Grid>,
						<Grid item xs={0} lg={0}></Grid>,
						<br />
					]: null }
					{/* Expenses (With Groupings) */}
					{ bothVisible ? [
						<Grid item xs={0} lg={0}></Grid>,
						<Grid item xs={12} lg={12}>
							{bothData?.nodes?.length>0 && <SankeyChart data={bothData} hideValues={hideValues}/> }
						</Grid>,
						<Grid item xs={0} lg={0}></Grid>,
						<br />
					] : null }
				</Grid>
			</Box>
		</ThemeProvider>
  );
}

export default App;
