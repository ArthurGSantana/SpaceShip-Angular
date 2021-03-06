import passport from 'passport';

import UserController from '../../controllers/userController.js';
import tokens from './../../auth/tokens.js';

const authorization = {
  local: (req, res, next) => {
    passport.authenticate(
      'local',
      {session: false},
      (error, user, info) => {
        if(error && error.name === 'InvalidArgumentError')
          return res.status(401).json({erro: error.message});

        if(error)
          return res.status(500).json({erro: error.message});

        if(!user)
          return res.status(401).json();

        req.user = user;
        return next();
      }
    )(req, res, next)
  },

  bearer: (req, res, next) => {
    passport.authenticate(
      'bearer',
      {session: false},
      (error, user, info) => {
        if(error && error.name === 'JsonWebTokenError')
          return res.status(401).json({erro: error.message});

        if(error && error.name === 'TokenExpiredError')
          return res.status(401).json({erro: error.message, expiradoEm: error.expiredAt});

        if(error)
          return res.status(500).json({erro: error.message});

        if(!user)
          return res.status(401).json();

        req.token = info.token;
        req.user = user;
        return next();
      }
    )(req, res, next)
  },

  refresh: async (req, res, next) => {
    try {
      const {refreshToken} = req.body;
  
      const id = await tokens.refresh.check(refreshToken);
      await tokens.refresh.invalid(refreshToken);
      req.user = await UserController.getUserStrategy(id);
      return next();

    } catch(error) {
      if(error.name === 'InvalidArgumentError') 
        return res.status(401).json({error: error.message});

      return res.status(500).json({error: error.message});
    }
  }
}

export default authorization;