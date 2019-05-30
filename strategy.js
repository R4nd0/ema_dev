var z = require('zero-fill')
  , n = require('numbro')
  , Phenotypes = require('../../../lib/phenotype')
  , ema = require('../../../lib/ema')

/*
Copyright 2019 king_fredo on reddit

	Donations are welcome! 
	ETH: 0x0e4c8a26b4bf9a03d8229d9fb6e34ff1d1713d35
	BTC: 1BXC1NQC3act5WyU94wr4vBVS7YS6BgMP8
	Verge XVG (low fees!): DKaXPhXL5THEwEh8ijgP3QFmjBwDEHovwo

Licence: MIT 
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including   without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

module.exports = {
  name: 'ema_dev',
  description: 'Trade on deviation as a percentage of 2 EMAs',

  getOptions: function () {
	this.option('period', 'period length, same as --period_length', String, '180s')
	this.option('period_length', 'period length, same as --period', String, '180s')
	this.option('min_periods', 'min. history periods', Number, 250)
	
	this.option('timeout_buy', 'periods after market action to wait', Number, 50)
	this.option('timeout_sell', 'periods after market action to wait', Number, 50)

	this.option('ema_buy_s', 'EMA trend periods', Number, 50)
	this.option('ema_buy_l', 'EMA trend periods', Number, 120)
	this.option('ema_sell_s', 'EMA trend periods', Number, 50)
	this.option('ema_sell_l', 'EMA trend periods', Number, 120)

	this.option('treshold_pct_buy_s', 'Treshold pct from EMA short to perform buy, set 0 to disable', Number, 1)
	this.option('treshold_pct_buy_l', 'Treshold pct from EMA long to perform buy, set 0 to disable', Number, 1.5)
	this.option('treshold_pct_sell_s', 'Treshold pct from EMA short to perform sell, set 0 to disable', Number, 0.8)
	this.option('treshold_pct_sell_l', 'Treshold pct from EMA long to perform sell, set 0 to disable', Number, 1)

  },

  calculate: function (s) {

	// Initially set buy / sell timeout to zero
    	if (typeof s.timeout_buy === 'undefined'){
    		s.timeout_buy = s.options.timeout_buy
    	}
    	if (typeof s.timeout_sell === 'undefined'){
    		s.timeout_sell = s.options.timeout_sell
    	}

    	ema(s, 'ema_buy_s', s.options.ema_buy_s)
    	ema(s, 'ema_buy_l', s.options.ema_buy_l)
    	ema(s, 'ema_sell_s', s.options.ema_sell_s)
    	ema(s, 'ema_sell_l', s.options.ema_sell_l)

  },
  onPeriod: function (s, cb) {
				
		if (s.period.close >= s.period.ema_sell_s * (1 + (1 * s.options.treshold_pct_sell_s/100)) &&
			s.period.close >= s.period.ema_sell_l * (1 + (1 * s.options.treshold_pct_sell_l/100)) &&
			s.timeout_sell < 0) {
			s.signal = 'sell'
			s.timeout_sell = s.options.timeout_sell
		}
		else if (s.period.close <= s.period.ema_buy_s * (1 - (1 * s.options.treshold_pct_buy_s/100)) &&
			s.period.close <= s.period.ema_buy_l * (1 - (1 * s.options.treshold_pct_buy_l/100)) &&
			s.timeout_buy < 0) {
			s.signal = 'buy'
			s.timeout_buy = s.options.timeout_buy
    		}
		else {
    		s.timeout_sell = s.timeout_sell-1
		s.timeout_buy = s.timeout_buy-1
		}
    cb()
  },

  onReport: function (s) {
    var cols = []

	if (typeof (s.period.ema_buy_s && s.period.ema_buy_l && s.period.ema_sell_s && s.period.ema_sell_l && s.period.close) !== 'undefined') {
		color = 'grey'
		cols.push('  ema buy s/l: ')
		cols.push(z(10, n(s.period.ema_buy_s).format('0.00000000'), ' ')[color])
		cols.push(' / ')
		cols.push(z(10, n(s.period.ema_buy_l).format('0.00000000'), ' ')[color])
		cols.push('  ema sell s/l: ')
		cols.push(z(10, n(s.period.ema_sell_s).format('0.00000000'), ' ')[color])
		cols.push(' / ')
		cols.push(z(10, n(s.period.ema_sell_l).format('0.00000000'), ' ')[color])
		cols.push(' timeout sell: ')
		cols.push(z(6, n(s.timeout_sell).format('0000'), ' ')[color])
		cols.push(' timeout buy: ')
		cols.push(z(6, n(s.timeout_buy).format('0000'), ' ')[color])
		cols.push(' period close: ')
		if (s.period.close >= s.period.ema_sell_s * (1 + (1 * s.options.treshold_pct_sell_s/100)) &&
			s.period.close >= s.period.ema_sell_l * (1 + (1 * s.options.treshold_pct_sell_l/100)) &&
			s.timeout_sell < 0) {
			color = 'blue'
			}
		else if (s.period.close <= s.period.ema_buy_s * (1 - (1 * s.options.treshold_pct_buy_s/100)) &&
			s.period.close <= s.period.ema_buy_l * (1 - (1 * s.options.treshold_pct_buy_l/100)) &&
			s.timeout_buy < 0) {
			color = 'blue'
			}
		cols.push(z(10, n(s.period.close).format('0.00000000'), ' ')[color])

		}
	else {
	cols.push('                                                      ')
	}
    return cols
  },

  phenotypes: {
    // -- common 

    period_length: Phenotypes.RangePeriod(30, 500, 's'),
    min_periods: Phenotypes.Range(500, 500),

    // -- strategy
    timeout_buy: Phenotypes.Range(10, 1000),
    timeout_sell:Phenotypes.Range(10, 1000),
    ema_buy_s: Phenotypes.Range(10, 100),
    ema_buy_l: Phenotypes.Range(50, 500),
    ema_sell_s: Phenotypes.Range(10, 100),
    ema_sell_l: Phenotypes.Range(50, 500),
    treshold_pct_buy_s: Phenotypes.RangeFloat(0.1, 5),
    treshold_pct_buy_l: Phenotypes.RangeFloat(0.1, 5),
    treshold_pct_sell_s: Phenotypes.RangeFloat(0.1, 5),
    treshold_pct_sell_l: Phenotypes.RangeFloat(0.1, 5)
  }
}

