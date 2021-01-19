const items = require("./loaders/items");

const resolvers = {
  Mutation: {
    createPrestamo: (_, { input }, { db }) =>
      db.tx(t => {
        return t.one("INSERT INTO prestamos(${this:name}) VALUES(${this:csv}) RETURNING *", input)
          .then(loan => {
            const query = t.none("UPDATE items SET estado_item='Prestado' WHERE id=$1", loan.item_id);
            return t.batch([loan]);
          });
      }).then(res => res[0]),
    renewPrestamo: (_, { input, id }, { db, update }) =>
      db.one(update(input, null, "prestamos") + " WHERE id=$1 RETURNING *", id),    
    returnPrestamo: (_, { input, codigo }, { db }) =>
      db.tx(t => {
        return t.one("UPDATE items SET estado_item='Disponible' WHERE codigo=$1 RETURNING *", codigo)
          .then(item => {
            const query = t.one("UPDATE prestamos SET f_devolucion=$1 WHERE item_id=$2 AND f_devolucion IS NULL RETURNING *", [input.f_devolucion, item.id]);
            return t.batch([query]);
          });
      }).then(res => res[0]),
  },
  Prestamo: {
    item: ({ item_id }) => (item_id ? items.load(item_id) : null),
    usuario: ({ usuario_id }, args, { db }) =>
      db.one("SELECT * FROM usuarios WHERE id=$1", usuario_id)
  },
};

module.exports = resolvers;
