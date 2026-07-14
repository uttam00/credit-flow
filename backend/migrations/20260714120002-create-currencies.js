'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('currencies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      module: {
        type: Sequelize.ENUM('CAMPAIGN', 'REPORT', 'DISCOVERY'),
        allowNull: false,
      },
      price_in_paise: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      plans: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addConstraint('currencies', {
      type: 'check',
      fields: ['price_in_paise'],
      name: 'currencies_price_in_paise_positive',
      where: { price_in_paise: { [Sequelize.Op.gt]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('currencies');
  },
};
