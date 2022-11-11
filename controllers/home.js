//load /views/index.ejs 
module.exports = {
    getIndex: (req, res) => {
      res.render("index.ejs");
    },
  };
  