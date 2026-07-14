'use strict';

// A plain CHECK constraint can only reference columns on the same row, so it
// can't express "currency_id must point at whichever currency is bound to
// the CAMPAIGN module" (that binding is data, looked up by module, not a
// fixed id we can hardcode without breaking "currencies are configurable,
// not hardcoded"). A trigger is the DB-level equivalent that can do the
// cross-table lookup.

const TRIGGER_INSERT = 'campaigns_currency_binding_insert';
const TRIGGER_UPDATE = 'campaigns_currency_binding_update';

const CHECK_BODY = `
  IF (SELECT module FROM currencies WHERE id = NEW.currency_id) <> 'CAMPAIGN' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'campaigns.currency_id must reference a currency bound to the CAMPAIGN module';
  END IF;
`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TRIGGER ${TRIGGER_INSERT}
      BEFORE INSERT ON campaigns
      FOR EACH ROW
      BEGIN
        ${CHECK_BODY}
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER ${TRIGGER_UPDATE}
      BEFORE UPDATE ON campaigns
      FOR EACH ROW
      BEGIN
        ${CHECK_BODY}
      END
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${TRIGGER_UPDATE}`);
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${TRIGGER_INSERT}`);
  },
};
