import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Meta, Story, moduleMetadata } from '@storybook/angular';
import { NgChartsModule } from 'ng2-charts';

import { ZenLGComponent } from './zen-lg.component';

export default {
  title: 'ZenMlComponent',
  component: ZenLGComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, MatButtonModule, NgChartsModule],
      providers: [],
      declarations: [],
    }),
  ],
} as Meta<ZenLGComponent>;

const Template: Story<ZenLGComponent> = (args: ZenLGComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
