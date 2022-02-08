const _ = require( 'lodash' )
const { stdin } = require('nodemon/lib/config/defaults')
const common = require( '../../utill/common' )

module.exports = { 
  getUserInfo: async function( conn, userId ) {
    let res = await conn.query( sql.getUser, [ userId ] ) 
    const user = common.connResultsAsCamelCase( res )[0]
    
    if( !user || _.isEmpty( user ) ) {
      throw new Error( 'user not fond' )
    }

    res = await conn.query( sql.getUserFriend, [ userId ] )
    user.userFriendList = common.connResultsAsCamelCase( res )
    
    return user     
  },
  signInUser: async function( conn, userId, password ) {
    let res = await common.connPromise( conn, sql.signInUser, [ userId, password ] )
    
    const user = common.connResultsAsCamelCase( res )[0]
    if( !user || _.isEmpty( user ) ) {
      throw new Error( 'user not fond' )
    }

    res = await common.connPromise( conn, sql.getUserFriend, [ userId ] )
    user.friendList = common.connResultsAsCamelCase( res )
    
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
}

const sql = {
  getUser: `
    SELECT user_id, name
    FROM user
    WHERE user_id = ?`,
  getUserFriend: `
    SELECT user_id, target_user_id
    FROM user_relation
    WHERE user_id = ? AND is_friend = true;`,
  signInUser: `
    SELECT user_id, name
    FROM kyu_talk.user
    WHERE user_id = ? AND password = ?`,
  signUpUser: `
    INSER INTO user 
    SET = ?`,
}
