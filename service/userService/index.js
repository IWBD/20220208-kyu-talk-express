const _ = require( 'lodash' )
const common = require( '../../utill/common' )

module.exports = { 
  getUserInfo: async function( conn, userId ) {
    let res = await common.connPromise( conn, sql.getUser, [ userId ] )
    const user = common.connResultsAsCamelCase( res )[0]
    
    if( !user || _.isEmpty( user ) ) {
      throw new Error( 'user not fond' )
    }

    res = await common.connPromise( conn, sql.getUserRelation, [ userId ] )
    const friendList = common.connResultsAsCamelCase( res )
    
    return { user, friendList }     
  },
  login: async function( conn, userId, password ) {
    let res = await common.connPromise( conn, sql.login, [ userId, password ] )
    const user = common.connResultsAsCamelCase( res )[0]
    if( !user || _.isEmpty( user ) ) {
      throw new Error( 'user not fond' )
    }
    return user  
  },
  signUpUser: async function( conn, { userId, password, name } ) {
    const user = common.connParamsAsPothole( { userId, password, name } ) 
    const { results } = await common.connPromise( conn, sql.signUpUser, user )
    
    if( results.affectedRows < 1 ) {
      throw new Error( 'db signUpUser error' )
    }
    
    return
  },
  checkUserDuplication: async function( conn, userId ) {
    const res = await common.connPromise( conn, sql.getUser, [ userId ] )
    return {
      isAvailable: res.results.length < 1
    }
  },
}

const sql = {
  getUser: `
    SELECT user_id, name
    FROM user
    WHERE user_id = ?`,
  getUserRelation: `
    SELECT B.user_id, B.name
    FROM user_relation as A
    INNER JOIN user as B on A.target_user_id = B.user_id
    WHERE A.user_id = ? AND A.is_friend = 1 AND A.is_block IS NULL`,
  login: `
    SELECT user_id, name
    FROM user
    WHERE user_id = ? AND password = ?`,
  signUpUser: `
    INSERT INTO user 
    SET ?`,
}
