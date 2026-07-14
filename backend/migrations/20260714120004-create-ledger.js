'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ledger', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      currency_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'currencies', key: 'id' },
        onDelete: 'RESTRICT',
      },
      amount_in_credits: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: Sequelize.ENUM('PURCHASE', 'CAMPAIGN_SPEND'),
        allowNull: false,
      },
      payment_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      // Foreign key to campaigns is added in the create-campaigns migration,
      // once that table exists.
      campaign_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('ledger', ['user_id', 'currency_id'], {
      name: 'ledger_user_currency_idx',
    });

    // A payment must grant credits at most once: two ledger rows for the
    // same payment_id can never both be inserted, even under concurrent or
    // duplicate webhook delivery.
    await queryInterface.addConstraint('ledger', {
      type: 'unique',
      fields: ['payment_id'],
      name: 'ledger_payment_id_unique',
    });

    await queryInterface.addConstraint('ledger', {
      type: 'check',
      fields: ['amount_in_credits'],
      name: 'ledger_amount_nonzero',
      where: { amount_in_credits: { [Sequelize.Op.ne]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ledger');
  },
};
