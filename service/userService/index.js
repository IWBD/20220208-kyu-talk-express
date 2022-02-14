const _ = require( 'lodash' )
const common = require( '../../util/common' )

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
    let user = common.connResultsAsCamelCase( res )[0]
    if( !user || _.isEmpty( user ) ) {
      throw new Error( 'user not fond' )
    }

    res = await common.connPromise( conn, sql.getUser, [ userId ] )
    user = common.connResultsAsCamelCase( res )[0]
    
    if( !user || _.isEmpty( user ) ) {
      throw new Error( 'user not fond' )
    }

    res = await common.connPromise( conn, sql.getUserRelation, [ userId ] )
    const friendList = common.connResultsAsCamelCase( res )
    
    return { user, friendList }  
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
  searchUser: async function( conn, userId, searchWord ) {
    let res = await common.connPromise( conn, sql.searchUser, [ userId, `%${searchWord}%` ] )
    return common.connResultsAsCamelCase( res )
  },
  addFriend: async function( conn, userId, targetUserId ) {
    let res = await common.connPromise( conn, sql.insertFriend, [ userId, targetUserId] )
    return common.connResultsAsCamelCase( res )
  },
  getFriendList: async function( conn, userId ) {
    let res = await common.connPromise( conn, sql.getUserRelation, [ userId ] )
    return common.connResultsAsCamelCase( res )
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
  searchUser: `
    SELECT user_id, name
    FROM user
    WHERE user_id != ? AND user_id like ?`,
  insertFriend: `
    INSERT INTO user_relation( user_id, target_user_id, is_friend )
    VALUES( ?, ?, 1 )`
}
