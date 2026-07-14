'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallet_balances', {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      currency_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'currencies', key: 'id' },
        onDelete: 'RESTRICT',
      },
      balance_in_credits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Composite primary key (user_id, currency_id) already enforces the
    // uniqueness of one balance row per user/currency pair.
    await queryInterface.addConstraint('wallet_balances', {
      type: 'check',
      fields: ['balance_in_credits'],
      name: 'wallet_balances_balance_non_negative',
      where: { balance_in_credits: { [Sequelize.Op.gte]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('wallet_balances');
  },
};
