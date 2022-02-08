const _ = require( 'lodash' )

module.exports = {
  connResultsAsCamelCase: ( { results } ) => {
    return _.map( results, result => _.mapKeys( result, ( value, key ) => _.camelCase( key ) ) )
  },
  connParamsAsPothole: ( params ) => {
    return _.mapKeys( params, ( value, key ) => _.lowerCase( key ).replace( /\s/g, '_' )  ) 
  },
  connPromise: ( conn, sql, values ) => {
    return new Promise( ( resolve ) => {
      conn.query( sql, values, function( err, results, fields ) {
        resolve( { err, results, fields })
      } )
    } )
  }
}