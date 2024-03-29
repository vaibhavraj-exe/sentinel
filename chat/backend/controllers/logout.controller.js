const logoutController = (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.status(200).send({ isUserLoggedOut: true });
};

export default logoutController;
