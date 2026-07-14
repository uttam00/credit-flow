'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('campaigns', {
      id: {
        type: Sequelize.INTEGER,
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      funded_amount_in_credits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('CREATED', 'FUNDED'),
        allowNull: false,
        defaultValue: 'CREATED',
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

    await queryInterface.addIndex('campaigns', ['user_id'], {
      name: 'campaigns_user_id_idx',
    });

    await queryInterface.addConstraint('campaigns', {
      type: 'check',
      fields: ['funded_amount_in_credits'],
      name: 'campaigns_funded_amount_non_negative',
      where: { funded_amount_in_credits: { [Sequelize.Op.gte]: 0 } },
    });

    await queryInterface.addConstraint('ledger', {
      type: 'foreign key',
      fields: ['campaign_id'],
      name: 'ledger_campaign_id_fkey',
      references: { table: 'campaigns', field: 'id' },
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('ledger', 'ledger_campaign_id_fkey');
    await queryInterface.dropTable('campaigns');
  },
};
