module.exports.isUserAuthenticated = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).send({
      message: 'You are not authorized to access this resource',
    });
  }
};
