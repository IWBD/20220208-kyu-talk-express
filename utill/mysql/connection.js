const mysql = require('mysql');
const pool = mysql.createPool( {
  connectionLimit: 1,
  host: 'localhost',
  user: 'root',
  password: 'mysql',
  database: 'kyu_talk'
} )

module.exports = {
  getConnection: () => {
    return new Promise( ( resolve, reject ) => {
      pool.getConnection( ( err, connection ) => {
        if ( err ) {
          reject( err )
        } 
        resolve( connection )
      } )
    } )
  }
}