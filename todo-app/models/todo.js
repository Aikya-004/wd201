"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Todo.belongsTo(models.User,{
        foreignKey: 'userId'
      })
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({ title: title, dueDate: dueDate, completed: false, userId });
    }
    static getTodos() {
      return this.findAll();
    }
    static async deleteTodo(id,userId) {
      return this.destroy({ where: { id,userId } });
    }
    static async overDue(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date().toISOString().split("T")[0],
          },
          userId,
          // completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static async dueToday(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date().toISOString().split("T")[0],
          },
          userId,
          // completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static async dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date().toISOString().split("T")[0],
          },
          userId,
          // completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static completedItems(userId) {
      return this.findAll({
        where: {
          completed: true,
          userId,
        },
      
        order: [["id", "ASC"]],
      });
    }
    setCompletionStatus(value) {
      return this.update({ completed: value });
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false, 
        validate: {
            notNull: true,
            len: 5
        }
     },
     dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false, 
      validate: {
          notNull: true,
          len: 5
      }
   }, 
    completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );
  return Todo;
};
