const _ = require( 'lodash' )
const common = require( '../../util/common' )

module.exports = { 
  getUserInfo: async function( conn, userId ) {
    const res = await common.connPromise( conn, sql.selectUser, [ userId ] )
    const user = common.connResultsAsCamelCase( res )[0]
    
    if( !user || _.isEmpty( user ) ) {
      throw new Error( 'user not fond' )
    }

    return user   
  },
  getUserRelationList: async function( conn, userId ) {
    let res = await common.connPromise( conn, sql.selectUserRelationByUser, [ userId ] )
    return common.connResultsAsCamelCase( res )
  },
  login: async function( conn, userId, password ) {
    const res = await common.connPromise( conn, sql.login, [ userId, password ] )
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
    const res = await common.connPromise( conn, sql.selectUser, [ userId ] )
    return {
      isAvailable: res.results.length < 1
    }
  },
  searchUser: async function( conn, userId, searchWord ) {
    let res = await common.connPromise( conn, sql.searchUser, [ userId, `%${searchWord}%` ] )
    return common.connResultsAsCamelCase( res )
  },
  addUserRelation: async function( conn, userId, targetUserIdList, isFriend = null, isBlock = null, update = false ) {
    const targetUserIdListStr = _.map( targetUserIdList, userId => {
      return `'${userId}'`
    } ).join(',')

    const s = _.replace( sql.selectUserRelationByTargetUser, '{{targetUserIdList}}', targetUserIdListStr )
    let res = await common.connPromise( conn, s, [ userId ] )
    const userRelationList = common.connResultsAsCamelCase( res )

    for( let i = 0; i < targetUserIdList.length; i++ ) {
      const userRelation = _.find( userRelationList, { userId: targetUserIdList[i] } )
      if( !userRelation ) {
        await common.connPromise( conn, sql.insertUserRelation, [ userId, targetUserIdList[i], isFriend ] ) 
      } else if( update ) {
        await common.connPromise( conn, sql.updateUserRelation, [ isFriend, isBlock, userId, targetUserIdList[i] ] )
      }
    }

    res = await common.connPromise( conn, s, [ userId ] )
    return common.connResultsAsCamelCase( res )
  },
  getUserList: async function( conn, userIdList ) {
    const userIdListStr = _.map( userIdList, userId => {
      return `'${userId}'`
    } ).join(',')
    let res = await common.connPromise( conn, sql.selectUserList, [ _.join( userIdList, ', ' ) ] )
    return common.connResultsAsCamelCase( res )
  }
}

const sql = {
  selectUser: `
    SELECT user_id, name
    FROM user
    WHERE user_id = ?`,
  selectUserRelationByUser: `
    SELECT B.user_id, B.name, A.is_friend, A.is_block
    FROM user_relation as A
    INNER JOIN user as B on A.target_user_id = B.user_id
    WHERE A.user_id = ?`,
  selectUserRelationByTargetUser: `
    SELECT B.user_id, B.name, A.is_friend, A.is_block
    FROM user_relation as A
    INNER JOIN user as B on A.target_user_id = B.user_id
    WHERE A.user_id = ? AND A.target_user_id IN ({{targetUserIdList}})`,
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
  insertUserRelation: `
    INSERT INTO user_relation( user_id, target_user_id, is_friend )
    VALUES( ?, ?, ? )`,
  selectUserList: `
    SELECT user_id, name
    FROM user
    WHERE user_id in (?)`,
  updateUserRelation: `
    UPDATE user_relation
    SET is_friend = ?, is_block = ?
    WHERE user_id = ? AND target_user_id = ?`
}
