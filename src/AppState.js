import React, { Component } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

import chart from './chart/c3-chart.js';
import service from './services/dataService.js';

class AppState extends Component {
	constructor(props) {
		super(props);
		const socket = io.connect('http://localhost:5000');
		this.state = {
			stockData: [],
			dateRange: 0,
			activeSymbol: '',
			socket: socket,
			loading: false
		}
		this.setAppState = this.setAppState.bind(this);
		this.getTickerList = this.getTickerList.bind(this);
		this.getActiveSymbol = this.getActiveSymbol.bind(this);
		this.newSocketEvent = this.newSocketEvent.bind(this);
		this.loadingStatus = this.loadingStatus.bind(this);
	}

	componentDidMount() {
		// initalize websocket
		this.state.socket.on('connect', () => {
			return console.warn('socket working! id: ' + this.state.socket.id);
		})

		// get stock data into our app
		axios.get(`/data/stocks`)
			.then(d => {
				const stockData = d.data.map(stock => stock);
				const activeSymbol = !stockData.length ? null : stockData[0][0].symbol;
				let dateRange = 12;

				if (activeSymbol) {
					const diff = service.monthDiff(stockData[0][0].date, stockData[0][stockData[0].length - 1].date);
					dateRange = service.deduceDateRange(diff);
				}

				// console.log(stockData.length, activeSymbol, dateRange);

				this.setAppState({
					'stockData': stockData,
					'activeSymbol': activeSymbol,
					'dateRange': dateRange
				}, done => {
					// console.log(this.state.stockData);
					// console.log(this.state.activeSymbol);
					if (stockData.length === 0) {
						return;
					}

					chart.draw(
						this.state.stockData,
						this.state.activeSymbol,
						this.state.dateRange
					)
				});
			})
	}

	setAppState(newState, callback) {
		this.setState(newState, () => {
			if (this.props.debug) {
				console.log('setAppState', JSON.stringify(this.state));
			}
			if (callback) {
				callback();
			}
		})
	}

	newSocketEvent(event) {
		return this.state.socket.emit(event.name, event.data);
	}

	getActiveSymbol() {
		return this.state.activeSymbol;
	}

	getTickerList() {
		return this.state.stockData.map(d => d);
	}

	loadingStatus(bool) {
		this.setState({ loading: bool });
	}

	render() {
		return (
			<div className="AppState">
				{React.Children.map(this.props.children, child => {
					return React.cloneElement(child, {
						appState: this.state,
						setAppState: this.setAppState,
						getTickers: this.getTickerList(),
						getActiveSymbol: this.getActiveSymbol(),
						isLoading: this.loadingStatus
					})
				})}
			</div>
		)
	}
}

export default AppState;