export class RollPbtAMasks extends pbta.dice.RollPbtA {
    /** @override */
    async configureDialog() {
        console.log('TESTING configureDialog');
        console.log(this);
        // console.log(this.data);
        return super.configureDialog({ situationalMods: true });
    }

    /** @override */
    _onDialogSubmit(html, stat) {
        console.log('TESTING _onDialogSubmit');
        console.log(this);
        return super._onDialogSubmit();
    }
}
