import { Roles } from 'meteor/alanning:roles';
import { upsertRolesData } from '../graphql/rolesData/mongo/rolesData';

export const can = (permission, projectId, userId, options) => {
    const bypassWithCI = { options };
    // Cypress code can bypass roles if the bypassWithCI is true and the CI env is set.
    if (!!bypassWithCI && (!!process.env.CI || !!process.env.DEV_MODE)) return true;
    return Roles.userIsInRole(userId || Meteor.userId(), permission, projectId);
};

export const checkIfCan = (permission, projectId, userId, options) => {
    if (!can(permission, projectId, userId, options)) throw new Meteor.Error('403', 'Forbidden');
};

const ue = { unlessExists: true };

const createRole = (name, description = 'some text') => {
    Roles.createRole(name, ue);
    upsertRolesData({ name, description, deletable: false });
};

if (Meteor.isServer) {
    export const setUpRoles = () => {
        createRole('nlu-data:r');
        createRole('nlu-data:w');
        Roles.addRolesToParent('nlu-data:r', 'nlu-data:w');
    
        createRole('nlu-model:r');
        Roles.addRolesToParent('nlu-data:r', 'nlu-model:r');
        createRole('nlu-model:w');
        Roles.addRolesToParent('nlu-model:r', 'nlu-model:w');
        
        
        createRole('nlu-viewer');
        Roles.addRolesToParent(['nlu-data:r', 'nlu-model:r'], 'nlu-viewer');
        
        createRole('nlu-model:x');
    
        Roles.addRolesToParent('nlu-viewer', 'nlu-model:x');

        createRole('nlu-editor');
        Roles.addRolesToParent(['nlu-data:w', 'nlu-model:x'], 'nlu-editor');
    
        createRole('responses:r');
        createRole('responses:w');
        Roles.addRolesToParent('responses:r', 'responses:w');

        createRole('stories:r');
        createRole('stories:w');
        Roles.addRolesToParent('stories:r', 'stories:w');
    
        createRole('copy-viewer');
        Roles.addRolesToParent(['responses:r', 'stories:r'], 'copy-viewer');
    
        createRole('copy-editor');
        Roles.addRolesToParent(['responses:w', 'stories:w'], 'copy-editor');
    
        createRole('conversations:r');
        createRole('conversations-viewer');
        Roles.addRolesToParent('conversations:r', 'conversations-viewer');

        createRole('conversations:w');
        Roles.addRolesToParent('conversations:r', 'conversations:w');
        createRole('conversations-editor');
        Roles.addRolesToParent('conversations:w', 'conversations-editor');
    
        createRole('project-settings:r');
        createRole('project-settings:w');
        Roles.addRolesToParent('project-settings:r', 'project-settings:w');
        
        createRole('project-viewer');
        Roles.addRolesToParent(['nlu-viewer', 'copy-viewer', 'conversations-viewer', 'project-settings:r'], 'project-viewer');
    

        createRole('analytics:r');
        createRole('project-admin');
        Roles.addRolesToParent(['nlu-editor', 'nlu-model:w', 'copy-editor', 'conversations-editor', 'project-settings:w', 'project-viewer', 'analytics:r'], 'project-admin');
    
        // Legacy owner role
        createRole('owner');
        Roles.addRolesToParent('project-admin', 'owner');
        
        createRole('global-settings:r');
        createRole('global-settings:w');
        Roles.addRolesToParent('global-settings:r', 'global-settings:w');
    
        createRole('projects:r');
        createRole('projects:w');
        Roles.addRolesToParent('projects:r', 'projects:w');
    
        createRole('users:r');
        createRole('users:w');
        Roles.addRolesToParent('users:r', 'users:w');
    
        createRole('global-admin');
        Roles.addRolesToParent(['users:w', 'projects:w', 'project-admin'], 'global-admin');
    };

    Meteor.startup(function() {
        setUpRoles();
    });
    
    // eslint-disable-next-line consistent-return
    Meteor.publish(null, function () {
        if (this.userId) {
            return Meteor.roleAssignment.find({ 'user._id': this.userId });
        }
        this.ready();
    });
}
